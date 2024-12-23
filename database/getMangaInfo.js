require('dotenv').config(); // Add this at the top of the file

const { MongoClient, ObjectId } = require('mongodb');

let client, db;

async function connectToDatabase() {
  if (!client) {
    try {
      client = new MongoClient(process.env.DB_URL, { useUnifiedTopology: true });
      
      await client.connect();
      
      db = client.db(process.env.DB_NAME);
      
      const collections = await db.listCollections().toArray();
      
      const mangaCollection = collections.find(c => c.name === process.env.MANGA_COLLECTION);
      if (mangaCollection) {
      } else {
        console.warn('Warning: Manga collection not found in the database');
      }
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }
  return { client, db };
}

async function searchById(id) {
  const { db } = await connectToDatabase();
  const collection = db.collection(process.env.MANGA_COLLECTION);

  let query;
  if (ObjectId.isValid(id)) {
    query = { _id: new ObjectId(id) };
  } else if (!isNaN(id)) {
    query = { _id: parseInt(id) };
  } else {
    query = { _id: id };
  }

  //console.log('Query:', query);
  const result = await collection.findOne(query);
  //console.log('Search result:', result);
  return result;
}

async function autocompleteSearch(query, limit = 10) {
  const { db } = await connectToDatabase();
  const collection = db.collection(process.env.MANGA_COLLECTION);

  const result = await collection.find(
    {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { alt_names: { $elemMatch: { $regex: query, $options: 'i' } } }
      ]
    },
    {
      projection: {
        _id: 1,
        title: 1,
        cover_image: 1
      }
    }
  ).limit(limit).toArray();

  return result;
}

module.exports = { searchById, autocompleteSearch };
