const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  startTime: { type: Date },
  endTime: { type: Date },
  votingEnabled: { type: Boolean, default: false }
});

module.exports = mongoose.model('Settings', settingsSchema);