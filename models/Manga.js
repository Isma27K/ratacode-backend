const mongoose = require('mongoose');

const MangaSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.Mixed,
  title: String,
  alt_names: [String],
  description: String,
  genres: [String],
  status: String,
  authors: [String],
  cover_image: String,
  latest_update: String,
  chapters: [{
    _id: mongoose.Schema.Types.Mixed,
    title: String,
    url: String,
    release_date: String,
    image_urls: [String]
  }]
});

module.exports = mongoose.model('Manga', MangaSchema);