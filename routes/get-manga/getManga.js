const express = require('express');
const router = express.Router();
const axios = require('axios'); // Add this line to import axios
const { searchById } = require('../../database/getMangaInfo');
const { getLatestManga } = require('../../database/getRandomData');
const { chapterImage } = require('../../database/getChapterImage');
const { PassThrough } = require('stream');

const getRandomManga = async () => {
    return await getRandomData();
};

const getMangaInfo = async (mangaId) => {
    try {
        const manga = await searchById(mangaId);
        if (manga) {
            const mangaInfo = JSON.parse(JSON.stringify(manga));
            if (mangaInfo.chapters) {
                mangaInfo.chapters.forEach(chapter => {
                    delete chapter.image_urls;
                });
            }
            return mangaInfo;
        }
        return null;
    } catch (error) {
        console.error('Error in getMangaInfo:', error);
        return null;
    }
};

const getChapterImages = async (mangaId, chapterId) => {
    const manga = await chapterImage(mangaId, chapterId);
    if (manga && manga._id == mangaId) {
        const chapter = manga.chapters.find(ch => ch._id == chapterId);
        return chapter ? chapter.image_urls : [];
    }
    return [];
};


// ================== ROUTES ==================
// Add this route to handle proxied image requests
router.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;    
    if (!imageUrl) {
        return res.status(400).send('No image URL provided');
    }

    try {
        const response = await axios.get(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://manganato.com/'
            },
            responseType: 'stream',
            timeout: 10000
        });        

        // Forward the content type
        res.setHeader('Content-Type', response.headers['content-type']);
        
        // Pipe the image stream directly to the response
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send(`Failed to load image: ${error.message}`);
    }
});


router.get('/getManga/:page?', async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        const mangaData = await getLatestManga(page);
        
        // Check if there's an error in the pagination
        if (mangaData.pagination.error) {
            return res.status(400).json(mangaData);
        }
        
        res.status(200).json(mangaData);
    } catch (error) {
        res.status(500).json({ 
            manga: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: 20,
                error: 'Server error occurred'
            }
        });
    }
});


router.get('/:mangaId/:chapterId?', async (req, res) => {
    const { mangaId, chapterId } = req.params;
    //console.log('Requested mangaId:', mangaId);

    if (chapterId) {
        const imageUrls = await getChapterImages(mangaId, chapterId);

        if (imageUrls.length === 0) {
            return res.status(404).send('Chapter not found');
        }

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://manganato.com/'
        };

        // Create a proxy server to handle image requests
        for (let i = 0; i < imageUrls.length; i++) {
            try {
                const response = await axios.get(imageUrls[i], {
                    headers: headers,
                    responseType: 'stream',
                    timeout: 10000
                });

                // Send the image URL and content type to the client
                res.write(`data: ${JSON.stringify({
                    index: i,
                    url: imageUrls[i],
                    contentType: response.headers['content-type']
                })}\n\n`);

            } catch (error) {
                console.error(`Failed to fetch image: ${imageUrls[i]}`, error);
                // Notify client about the failed image
                res.write(`data: ${JSON.stringify({
                    index: i,
                    error: 'Failed to load image'
                })}\n\n`);
            }
        }

        // Send end event
        res.write(`data: ${JSON.stringify({ end: true })}\n\n`);
        res.end();
    } else {
        //console.log('Fetching manga info for id:', mangaId);
        const mangaInfo = await getMangaInfo(mangaId);
        //console.log('Retrieved mangaInfo:', mangaInfo);
        if (!mangaInfo) {
            //console.log('Manga not found in database');
            return res.status(404).send('Manga not found');
        }
        res.json(mangaInfo);
    }
});





module.exports = router;