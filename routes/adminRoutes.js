const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const Settings = require('../models/Settings');
const Category = require('../models/Category');
const crypto = require('crypto');
const fs = require('fs');
const csv = require('csv-parser');
const multer = require('multer');
const localUpload = multer({ storage: multer.memoryStorage() });

// Get Dashboard Stats
router.get('/stats', protect, async (req, res) => {
  try {
    const totalVoters = await Voter.countDocuments();
    const votedVoters = await Voter.countDocuments({ hasVoted: true });
    const candidates = await Candidate.find();
    res.json({ totalVoters, votedVoters, candidates });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage Voters
router.post('/voters', protect, async (req, res) => {
  try {
    const { email } = req.body;
    let voter = await Voter.findOne({ email });
    if (voter) return res.status(400).json({ message: 'Voter already exists' });
    voter = await Voter.create({ email });
    res.json({ message: 'Voter added successfully', voter });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk Upload via CSV
router.post('/voters/bulk-csv', protect, localUpload.single('csvFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Please upload a CSV file' });

  const results = [];
  const { Readable } = require('stream');
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csv(['email'])) // Assumes first column is email or header 'email'
    .on('data', (data) => {
      if (data.email && data.email.includes('@')) {
        results.push(data.email.trim());
      }
    })
    .on('end', async () => {
      try {
        let addedCount = 0;
        for (const email of results) {
          const exists = await Voter.findOne({ email });
          if (!exists) {
            await Voter.create({ email });
            addedCount++;
          }
        }
        res.json({ message: `Successfully processed CSV. Added ${addedCount} new voters.` });
      } catch (err) {
        res.status(500).json({ message: 'Error processing voters' });
      }
    });
});

router.get('/voters', protect, async (req, res) => {
  try {
    const voters = await Voter.find();
    res.json(voters);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const { sendVotingLink } = require('../config/email');

router.post('/voters/generate-links', protect, async (req, res) => {
  try {
    const voters = await Voter.find();
    const settings = await Settings.findOne() || { electionName: 'Online Voting System' };
    const electionName = settings.electionName;

    for (let voter of voters) {
      if (!voter.votingToken) {
        voter.votingToken = crypto.randomBytes(20).toString('hex');
        await voter.save();
      }
      // Send email if they have a token (either newly generated or existing)
      const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
      const link = `${baseUrl}/voting.html?token=${voter.votingToken}`;
      await sendVotingLink(voter.email, link, electionName);
    }
    res.json({ message: 'Voting links generated and emailed to all voters' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage Candidates
router.post('/candidates', protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, party, category } = req.body;
    const image = req.files && req.files['image'] ? req.files['image'][0].path : '';
    const logo = req.files && req.files['logo'] ? req.files['logo'][0].path : '';
    
    const candidate = await Candidate.create({ name, party, category, image, logo });
    res.json({ message: 'Candidate added successfully', candidate });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/candidates/:id', protect, async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage Settings
router.get('/settings', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/settings', protect, async (req, res) => {
  try {
    const { electionName, startTime, endTime, votingEnabled, showResults } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ electionName, startTime, endTime, votingEnabled, showResults });
    } else {
      settings.electionName = electionName || settings.electionName;
      settings.startTime = startTime;
      settings.endTime = endTime;
      settings.votingEnabled = votingEnabled;
      settings.showResults = showResults;
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Categories Management
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/categories', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Category already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/categories/:id', protect, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset', protect, async (req, res) => {
  try {
    await Voter.deleteMany({});
    await Candidate.deleteMany({});
    await Category.deleteMany({});
    await Settings.findOneAndUpdate({}, { 
      votingEnabled: false, 
      showResults: false,
      startTime: null,
      endTime: null
    }, { upsert: true });
    
    res.json({ message: 'All system data has been cleared successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset system data.' });
  }
});

module.exports = router;