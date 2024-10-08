require('dotenv').config(); // Add this at the very top of the file

//console.log('All environment variables:', process.env);

const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import CORS middleware
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const { searchById, autocompleteSearch } = require('./database/getMangaInfo');
const getManga = require('./routes/get-manga/getManga');
const searchRouter = require('./routes/search/search');

// Connect to MongoDB
//mongoose.connect(process.env.MONGODB_URI)
//  .then(() => console.log('MongoDB connected...'))
//  .catch(err => console.log('MongoDB connection error:', err));

// Enable CORS
app.use(cors());

app.use((req, res, next) => {
    //console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
}

app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL parameter is missing');
    }

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://manganato.com/'
    };

    try {
        const response = await axios.get(url, {
            headers: headers,
            responseType: 'arraybuffer',
            timeout: 10000
        });

        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        res.status(500).send(`Failed to fetch the image: ${error.message}`);
    }
});

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Hello World' });
});

// Use routes
app.use('/data', getManga);
app.use('/api/search', searchRouter);

// Catch-all route for production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
