require('dotenv').config(); // Add this at the top of the file

const { MongoClient } = require('mongodb');
const Manga = require('../models/Manga');

let client, db;

async function connectToDatabase() {
	//console.log('Attempting to connect to database in getRandomData.js...');
	//console.log('DB_URL:', process.env.DB_URL);
	//console.log('DB_NAME:', process.env.DB_NAME);
	//console.log('MANGA_COLLECTION:', process.env.MANGA_COLLECTION);

	if (!client) {
		try {
			client = new MongoClient(process.env.DB_URL, { useUnifiedTopology: true });
			//console.log('MongoDB client created in getRandomData.js');
			
			await client.connect();
			//console.log('Connected to MongoDB in getRandomData.js');
			
			db = client.db(process.env.DB_NAME);
			//console.log('Database selected in getRandomData.js:', process.env.DB_NAME);
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
	console.log('getLatestManga function called');
	try {
		const { db } = await connectToDatabase();
		//console.log('Connected to database in getLatestManga');

		// Make sure the collection name is a string
		const collectionName = process.env.MANGA_COLLECTION || 'manga';
		//console.log('Using collection:', collectionName);

		const collection = db.collection(collectionName);

		// Fetch the 30 latest manga from the database, sorting by latest_update (date and time)
		//console.log('Executing aggregation pipeline');
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

module.exports = { getLatestManga }; // Export the function as part of an object
