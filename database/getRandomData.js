require('dotenv').config(); // Add this at the top of the file

const { MongoClient } = require('mongodb');

async function getLatestManga(size = 30) {
  const url = process.env.DB_URL; // MongoDB URL from environment variables
  const dbName = process.env.DB_NAME; // Database name from environment variables
  const client = new MongoClient(url, { useUnifiedTopology: true });

  try {
    await client.connect();
    // console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(process.env.MANGA_COLLECTION); // Collection name from environment variables

    // Updated aggregation pipeline to sort by latest_update after converting to date
    const latestManga = await collection.aggregate([
      {
        $addFields: {
          latest_update_date: {
            $dateFromString: {
              dateString: "$latest_update",
              format: "%b %d,%Y %H:%M"
            }
          }
        }
      },
      { $sort: { "latest_update_date": -1 } }, // Sort by the new date field
      { $limit: size },
      { 
        $project: {
          "chapters.image_urls": 0,
          "chapters.url": 0,
          latest_update_date: 0 // Exclude the temporary date field
        }
      }
    ]).toArray();

    return latestManga;

  } catch (err) {
    // console.error("Error fetching random data:", err);
    throw err; // Re-throw the error for proper handling
  } finally {
    await client.close();
    // console.log("Disconnected from MongoDB");
  }
}

module.exports = { getLatestManga }; // Export the function as part of an object
