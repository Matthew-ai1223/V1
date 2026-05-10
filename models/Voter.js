const mongoose = require('mongoose');

const crypto = require('crypto');

const voterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  hasVoted: { type: Boolean, default: false },
  votingToken: { type: String, unique: true, sparse: true }
}, { timestamps: true });

voterSchema.pre('save', function(next) {
  if (!this.votingToken) {
    this.votingToken = crypto.randomBytes(20).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Voter', voterSchema);