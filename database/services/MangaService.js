const { MongoClient } = require('mongodb');
require('dotenv').config();

class MangaService {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        if (!this.client) {
            this.client = new MongoClient(process.env.DB_URL, { useUnifiedTopology: true });
            await this.client.connect();
            this.db = this.client.db(process.env.DB_NAME);
            
            // Create indexes if they don't exist
            await this.createIndexes();
        }
        return this.db;
    }

    async createIndexes() {
        const latestIndex = this.db.collection('latest_manga_index');
        
        // Create indexes for faster sorting and querying
        await latestIndex.createIndex({ latest_update: -1 });
        await latestIndex.createIndex({ manga_id: 1 }, { unique: true });
    }

    async getLatestManga(page = 1) {
        try {
            const db = await this.connect();
            const itemsPerPage = 20;

            // Use the optimized latest_manga_index collection
            const indexCollection = db.collection('latest_manga_index');
            
            // Get total count
            const totalCount = await indexCollection.countDocuments();
            const totalPages = Math.ceil(totalCount / itemsPerPage);

            // Validate and adjust page number
            page = Math.min(Math.max(1, page), totalPages || 1);

            // Get latest manga from index with proper date sorting
            const latestManga = await indexCollection
                .find({})
                .sort({ latest_update: -1 })  // Sort by ISO date string
                .skip((page - 1) * itemsPerPage)
                .limit(itemsPerPage)
                .toArray();

            // Format dates for display if needed
            const formattedManga = latestManga.map(manga => ({
                ...manga,
                latest_update: manga.latest_update ? 
                    new Date(manga.latest_update).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }) : null
            }));

            return {
                manga: formattedManga,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage
                }
            };
        } catch (error) {
            console.error('Error in getLatestManga:', error);
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
    }
}

module.exports = new MangaService(); 