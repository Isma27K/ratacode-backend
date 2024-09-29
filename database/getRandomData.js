require('dotenv').config(); // Add this at the top of the file

const { MongoClient } = require('mongodb');
const Manga = require('../models/Manga');

let client, db;

async function connectToDatabase() {
	if (!client) {
		client = new MongoClient(process.env.DB_URL, { useUnifiedTopology: true });
		await client.connect();
		db = client.db(process.env.DB_NAME);
	}
	return { client, db };
}

const getLatestManga = async () => {
	try {
		const { db } = await connectToDatabase();
		const collection = db.collection(process.env.MANGA_COLLECTION);

		// Fetch the 30 latest manga from the database, sorting by latest_update (date and time)
		const latestManga = await collection.aggregate([
			{ $addFields: { 
				latest_update_date: { $toDate: "$latest_update" } 
			}},
			{ $sort: { latest_update_date: -1 } },
			{ $limit: 30 },
			{
				$project: {
					"chapters.image_urls": 0,
					"chapters.url": 0,
					latest_update_date: 0
				}
			}
		]).toArray();

		return latestManga;
	} catch (error) {
		console.error('Error in getLatestManga:', error);
		throw error;
	}
};

module.exports = { getLatestManga }; // Export the function as part of an object
