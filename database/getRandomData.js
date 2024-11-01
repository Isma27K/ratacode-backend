require('dotenv').config();

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
			throw new Error('Database connection failed');
		}
	}
	return { client, db };
}

const getLatestManga = async (page = 1) => {
	try {
		// Ensure page is a valid number
		page = parseInt(page);
		if (isNaN(page) || page < 1) {
			return {
				manga: [],
				pagination: {
					currentPage: 1,
					totalPages: 0,
					totalItems: 0,
					itemsPerPage: 20,
					error: 'Invalid page number'
				}
			};
		}

		const { db } = await connectToDatabase();
		if (!db) {
			throw new Error('Database connection not available');
		}

		const collectionName = process.env.MANGA_COLLECTION || 'manga';
		const collection = db.collection(collectionName);

		// Get total count and calculate pages
		const totalCount = await collection.countDocuments();
		const totalPages = Math.ceil(totalCount / 20);

		// If page exceeds total pages, return last page instead of error
		if (page > totalPages) {
			page = totalPages || 1; // Use 1 if totalPages is 0
		}

		const latestManga = await collection.aggregate([
			{ 
				$addFields: { 
						latest_update_date: { $toDate: "$latest_update" } 
				}
			},
			{ $sort: { latest_update_date: -1 } },
			{ $skip: (page - 1) * 20 },
			{ $limit: 20 },
			{
				$project: {
					"chapters.image_urls": 0,
					"chapters.url": 0,
					latest_update_date: 0
				}
			}
		]).toArray();
		
		return {
			manga: latestManga,
			pagination: {
				currentPage: page,
				totalPages: totalPages,
				totalItems: totalCount,
				itemsPerPage: 20
			}
		};
	} catch (error) {
		console.error('Error in getLatestManga:', error);
		// Return a structured error response instead of throwing
		return {
			manga: [],
			pagination: {
				currentPage: 1,
				totalPages: 0,
				totalItems: 0,
				itemsPerPage: 20,
				error: 'Failed to fetch manga data'
			}
		};
	}
};

module.exports = { getLatestManga };
