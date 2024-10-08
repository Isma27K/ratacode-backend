require('dotenv').config(); // Add this at the top of the file

const { MongoClient, ObjectId } = require('mongodb');

let client, db;

async function connectToDatabase() {
  //console.log('Attempting to connect to database...');
  //console.log('DB_URL:', process.env.DB_URL);
  //console.log('DB_NAME:', process.env.DB_NAME);
  //console.log('MANGA_COLLECTION:', process.env.MANGA_COLLECTION);

  if (!client) {
    try {
      client = new MongoClient(process.env.DB_URL, { useUnifiedTopology: true });
      //console.log('MongoDB client created');
      
      await client.connect();
      //console.log('Connected to MongoDB');
      
      db = client.db(process.env.DB_NAME);
      //console.log('Database selected:', process.env.DB_NAME);
      
      // Test the connection by listing collections
      const collections = await db.listCollections().toArray();
      //console.log('Collections in the database:', collections.map(c => c.name));
      
      // Check if the manga collection exists
      const mangaCollection = collections.find(c => c.name === process.env.MANGA_COLLECTION);
      if (mangaCollection) {
        //console.log('Manga collection found');
      } else {
        console.warn('Warning: Manga collection not found in the database');
      }
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  } else {
    //console.log('Using existing database connection');
  }
  return { client, db };
}

async function searchById(id) {
  //console.log('Searching for manga with id:', id);
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
