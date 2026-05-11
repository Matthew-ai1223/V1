const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  electionName: { type: String, default: 'Online Voting System' },
  startTime: { type: Date },
  endTime: { type: Date },
  votingEnabled: { type: Boolean, default: false },
  showResults: { type: Boolean, default: false }
});

module.exports = mongoose.model('Settings', settingsSchema);