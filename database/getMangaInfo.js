require('dotenv').config(); // Add this at the top of the file

const { MongoClient, ObjectId } = require('mongodb');

async function searchById(id) {
  const url = process.env.DB_URL; // Replace with your MongoDB URL
  const dbName = process.env.DB_NAME; // Replace with your database name
  //console.log("DB_URL:", url); // Add this line
  //console.log("DB_NAME:", dbName); // Add this line
  const client = new MongoClient(url, { useUnifiedTopology: true });

  try {
    await client.connect();
    //console.log("Connected to MongoDB");

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

    // Search for the document
    const document = await collection.findOne(query);

    if (document) {
      //console.log("Document found:", document);
      return document;
    } else {
      console.log("No document found with the given _id.");
      return null;
    }

  } catch (err) {
    //console.error("Error searching for _id:", err);
    throw err; // Re-throw the error for proper handling in the calling function
  } finally {
    await client.close();
    //console.log("Disconnected from MongoDB");
  }
}

module.exports = { searchById };  // Export as an object
