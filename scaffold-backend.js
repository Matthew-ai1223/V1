const fs = require('fs');
const path = require('path');

const files = {
  '.env': `
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/online-voting
JWT_SECRET=supersecretjwtkey
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://v1-one-henna.vercel.app
  `,

  'server.js': `
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const voterRoutes = require('./routes/voterRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/voter', voterRoutes);

// Fallback for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

// Socket.io for live results (optional, basic setup)
const io = require('socket.io')(server, {
  cors: { origin: '*' }
});
app.set('io', io);
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
  `,

  'config/db.js': `
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;
  `,

  'config/cloudinary.js': `
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voting_system',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

const upload = multer({ storage });
module.exports = { cloudinary, upload };
  `,

  'models/Admin.js': `
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
  `,

  'models/Voter.js': `
const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  hasVoted: { type: Boolean, default: false },
  votingToken: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('Voter', voterSchema);
  `,

  'models/Candidate.js': `
const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  image: { type: String }, // Cloudinary URL
  logo: { type: String },  // Cloudinary URL
  votes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
  `,

  'models/Settings.js': `
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  startTime: { type: Date },
  endTime: { type: Date },
  votingEnabled: { type: Boolean, default: false }
});

module.exports = mongoose.model('Settings', settingsSchema);
  `,

  'middleware/authMiddleware.js': `
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
  `,

  'routes/authRoutes.js': `
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, email: admin.email });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create initial admin (for setup)
router.post('/setup', async (req, res) => {
  try {
    const adminExists = await Admin.findOne();
    if (adminExists) return res.status(400).json({ message: 'Admin already exists' });
    const admin = await Admin.create({ email: req.body.email, password: req.body.password });
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
  `,

  'routes/adminRoutes.js': `
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const Settings = require('../models/Settings');
const crypto = require('crypto');

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

router.get('/voters', protect, async (req, res) => {
  try {
    const voters = await Voter.find();
    res.json(voters);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/voters/generate-links', protect, async (req, res) => {
  try {
    const voters = await Voter.find();
    for (let voter of voters) {
      if (!voter.votingToken) {
        voter.votingToken = crypto.randomBytes(20).toString('hex');
        await voter.save();
      }
    }
    res.json({ message: 'Voting links generated for all voters' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage Candidates
router.post('/candidates', protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, party } = req.body;
    const image = req.files && req.files['image'] ? req.files['image'][0].path : '';
    const logo = req.files && req.files['logo'] ? req.files['logo'][0].path : '';
    
    const candidate = await Candidate.create({ name, party, image, logo });
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
    const { startTime, endTime, votingEnabled } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    settings.startTime = startTime;
    settings.endTime = endTime;
    settings.votingEnabled = votingEnabled;
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
  `,

  'routes/voterRoutes.js': `
const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const Settings = require('../models/Settings');

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

// Submit vote
router.post('/vote/:token', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.votingEnabled) return res.status(403).json({ message: 'Voting is disabled' });
    const now = new Date();
    if (settings.endTime && now > settings.endTime) return res.status(403).json({ message: 'Voting has ended' });

    const { candidateId } = req.body;
    const voter = await Voter.findOne({ votingToken: req.params.token });
    if (!voter) return res.status(404).json({ message: 'Invalid voting link' });
    if (voter.hasVoted) return res.status(403).json({ message: 'You have already voted' });

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    candidate.votes += 1;
    await candidate.save();

    voter.hasVoted = true;
    await voter.save();

    // Emit socket event for live results
    const io = req.app.get('io');
    if (io) {
      const candidates = await Candidate.find();
      io.emit('voteUpdate', candidates);
    }

    res.json({ message: 'Vote submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public Results
router.get('/results', async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
  `
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\\n');
}

console.log('Backend scaffolding complete.');
