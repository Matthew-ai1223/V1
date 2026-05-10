const mongoose = require('mongoose');
require('dotenv').config();
const Candidate = require('./models/Candidate');
const Settings = require('./models/Settings');
const Voter = require('./models/Voter');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const candidates = await Candidate.find();
    console.log('Candidates count:', candidates.length);
    console.log('Candidates:', JSON.stringify(candidates, null, 2));

    const settings = await Settings.findOne();
    console.log('Settings:', JSON.stringify(settings, null, 2));

    const voters = await Voter.find();
    console.log('Voters count:', voters.length);
    if (voters.length > 0) {
        console.log('First voter:', JSON.stringify(voters[0], null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
