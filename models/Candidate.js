const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  category: { type: String, required: true, default: 'General' },
  image: { type: String }, // Cloudinary URL
  logo: { type: String },  // Cloudinary URL
  votes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);