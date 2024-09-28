require('dotenv').config(); // Add this at the top of the file

const { MongoClient, ObjectId } = require('mongodb');

async function chapterImage(id, chapterId) {
  const url = process.env.DB_URL; // Replace with your MongoDB URL
  const dbName = process.env.DB_NAME; // Replace with your database name
  const client = new MongoClient(url, { useUnifiedTopology: true });

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(process.env.MANGA_COLLECTION); // Replace with your collection name

    // Handle different types of IDs
    let query;
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else if (!isNaN(id)) {
      query = { _id: parseInt(id) };
    } else {
      query = { _id: id };
    }

    // Add chapter filter to the query
    query['chapters._id'] = parseInt(chapterId);

    // Search for the document and project only the matching chapter
    const document = await collection.findOne(query, {
      projection: {
        _id: 1,
        'chapters.$': 1
      }
    });

    if (document) {
      return document;
    } else {
      console.log("No document found with the given _id and chapterId.");
      return null;
    }

  } catch (err) {
    throw err;
  } finally {
    await client.close();
  }
}

module.exports = { chapterImage };  // Export as an object
