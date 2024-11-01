require('dotenv').config(); // Add this at the top of the file

const { MongoClient } = require('mongodb');
const Manga = require('../models/Manga');

let client, db;

async function connectToDatabase() {
	if (!client) {
		try {
			client = new MongoClient(process.env.DB_URL, { useUnifiedTopology: true });
			
			await client.connect();
			
			db = client.db(process.env.DB_NAME);
		} catch (error) {
			console.error('Failed to connect to MongoDB in getRandomData.js:', error);
			throw error;
		}
	} else {
		console.log('Using existing database connection in getRandomData.js');
	}
	return { client, db };
}

const getLatestManga = async () => {
	try {
		const { db } = await connectToDatabase();

		const collectionName = process.env.MANGA_COLLECTION || 'manga';

		const collection = db.collection(collectionName);

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

		console.log(`Found ${latestManga.length} manga`);
		return latestManga;
	} catch (error) {
		console.error('Error in getLatestManga:', error);
		throw error;
	}
};

module.exports = { getLatestManga };
