const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const Settings = require('../models/Settings');

// Authenticate voter via email (for public shared link)
router.post('/auth-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const settings = await Settings.findOne();
    if (!settings || !settings.votingEnabled) {
      return res.status(403).json({ message: 'Voting is currently disabled' });
    }

    const voter = await Voter.findOne({ email: email.toLowerCase() });
    if (!voter) {
      return res.status(404).json({ message: 'Your email is not on the eligible voters list. Please contact the administrator.' });
    }

    if (voter.hasVoted) {
      return res.status(403).json({ message: 'You have already cast your vote.' });
    }

    // Return the token so the frontend can load the ballot
    res.json({ token: voter.votingToken, email: voter.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during authentication' });
  }
});

// Verify token and get ballot
router.get('/ballot/:token', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.votingEnabled) {
      return res.status(403).json({ message: 'Voting is currently disabled' });
    }
    const now = new Date();
    if (settings.startTime && now < settings.startTime) return res.status(403).json({ message: 'Voting has not started yet' });
    if (settings.endTime && now > settings.endTime) return res.status(403).json({ message: 'Voting has ended' });

    const voter = await Voter.findOne({ votingToken: req.params.token });
    if (!voter) return res.status(404).json({ message: 'Invalid voting link' });
    if (voter.hasVoted) return res.status(403).json({ message: 'You have already voted' });

    const candidates = await Candidate.find();
    res.json({ candidates, email: voter.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit votes for multiple categories
router.post('/vote/:token', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.votingEnabled) return res.status(403).json({ message: 'Voting is disabled' });
    const now = new Date();
    if (settings.endTime && now > settings.endTime) return res.status(403).json({ message: 'Voting has ended' });

    const { candidateIds } = req.body; // Expecting an array of IDs
    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ message: 'No candidates selected' });
    }

    const voter = await Voter.findOne({ votingToken: req.params.token });
    if (!voter) return res.status(404).json({ message: 'Invalid voting link' });
    if (voter.hasVoted) return res.status(403).json({ message: 'You have already voted' });

    // Verify all candidates exist
    const candidates = await Candidate.find({ _id: { $in: candidateIds } });
    if (candidates.length !== candidateIds.length) {
      return res.status(400).json({ message: 'One or more selected candidates are invalid' });
    }

    // Increment votes for each selected candidate
    for (const candidate of candidates) {
      candidate.votes += 1;
      await candidate.save();
    }

    voter.hasVoted = true;
    await voter.save();

    // Emit socket event for live results
    const io = req.app.get('io');
    if (io) {
      const allCandidates = await Candidate.find();
      io.emit('voteUpdate', allCandidates);
    }

    res.json({ message: 'Votes submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during voting' });
  }
});

// Public Results
router.get('/results', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.showResults) {
      return res.status(403).json({ message: 'Results have not been released yet.' });
    }
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;