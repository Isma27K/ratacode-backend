const MangaService = require('./services/MangaService');

const getLatestManga = async (page = 1) => {
	return await MangaService.getLatestManga(page);
};

module.exports = { getLatestManga };
