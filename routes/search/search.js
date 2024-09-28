const express = require('express');
const router = express.Router();
const { autocompleteSearch } = require('../../database/getMangaInfo');

router.get('/', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    //console.log('Received search request for:', query);
    const results = await autocompleteSearch(query);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'An error occurred during search', details: error.message });
  }
});

module.exports = router;
