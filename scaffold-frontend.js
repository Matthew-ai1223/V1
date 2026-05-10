const fs = require('fs');
const path = require('path');

const files = {
  'frontend/index.html': `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Online Voting System</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="landing-container">
    <h1>Welcome to the Secure Online Voting System</h1>
    <p>Please use the unique link sent to your email to access your voting ballot.</p>
    <a href="/admin-login.html" class="btn">Admin Login</a>
  </div>
</body>
</html>
  `,

  'frontend/admin-login.html': `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Login</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="form-container">
    <h2>Admin Login</h2>
    <form id="loginForm">
      <div class="input-group">
        <label>Email</label>
        <input type="email" id="email" required>
      </div>
      <div class="input-group">
        <label>Password</label>
        <input type="password" id="password" required>
      </div>
      <button type="submit" class="btn">Login</button>
    </form>
    <p id="errorMsg" class="error"></p>
  </div>
  <script src="js/admin.js"></script>
</body>
</html>
  `,

  'frontend/admin-dashboard.html': `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <nav class="navbar">
    <h2>Admin Dashboard</h2>
    <button id="logoutBtn" class="btn-small">Logout</button>
  </nav>
  
  <div class="dashboard-container">
    <div class="stats-row">
      <div class="stat-card"><h3>Total Voters</h3><p id="totalVoters">0</p></div>
      <div class="stat-card"><h3>Votes Cast</h3><p id="votedVoters">0</p></div>
      <div class="stat-card"><h3>Candidates</h3><p id="totalCandidates">0</p></div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" onclick="showTab('voters')">Manage Voters</button>
      <button class="tab-btn" onclick="showTab('candidates')">Manage Candidates</button>
      <button class="tab-btn" onclick="showTab('settings')">Settings</button>
    </div>

    <div id="voters" class="tab-content active">
      <h3>Add Voter</h3>
      <form id="addVoterForm" class="inline-form">
        <input type="email" id="voterEmail" placeholder="Voter Email" required>
        <button type="submit" class="btn">Add Voter</button>
      </form>
      <button id="generateLinksBtn" class="btn btn-secondary">Generate Voting Links</button>
      <ul id="voterList" class="list"></ul>
    </div>

    <div id="candidates" class="tab-content">
      <h3>Add Candidate</h3>
      <form id="addCandidateForm" class="stacked-form">
        <input type="text" id="candidateName" placeholder="Candidate Name" required>
        <input type="text" id="candidateParty" placeholder="Political Party" required>
        <label>Candidate Image</label>
        <input type="file" id="candidateImage" accept="image/*">
        <label>Party Logo</label>
        <input type="file" id="partyLogo" accept="image/*">
        <button type="submit" class="btn">Add Candidate</button>
      </form>
      <div id="candidateList" class="candidate-grid"></div>
    </div>

    <div id="settings" class="tab-content">
      <h3>Election Settings</h3>
      <form id="settingsForm" class="stacked-form">
        <label>Start Time</label>
        <input type="datetime-local" id="startTime">
        <label>End Time</label>
        <input type="datetime-local" id="endTime">
        <label>
          <input type="checkbox" id="votingEnabled"> Enable Voting
        </label>
        <button type="submit" class="btn">Save Settings</button>
      </form>
    </div>
  </div>
  <script src="js/admin.js"></script>
</body>
</html>
  `,

  'frontend/voting.html': `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Voting Ballot</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="ballot-container">
    <h2>Secure Voting Ballot</h2>
    <p id="voterInfo"></p>
    <div id="ballotCandidates" class="candidate-grid"></div>
  </div>
  <script src="js/voting.js"></script>
</body>
</html>
  `,

  'frontend/results.html': `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Election Results</title>
  <link rel="stylesheet" href="css/style.css">
  <script src="/socket.io/socket.io.js"></script>
</head>
<body>
  <div class="results-container">
    <h2>Live Election Results</h2>
    <div id="resultsGrid" class="candidate-grid"></div>
  </div>
  <script src="js/results.js"></script>
</body>
</html>
  `,

  'frontend/css/style.css': `
:root {
  --primary-color: #4CAF50;
  --secondary-color: #2196F3;
  --bg-color: #f4f7f6;
  --card-bg: #fff;
  --text-color: #333;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  margin: 0;
  padding: 0;
}

.landing-container, .form-container, .dashboard-container, .ballot-container, .results-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.dashboard-container { max-width: 1000px; }

h1, h2, h3 { text-align: center; }

.btn {
  background-color: var(--primary-color);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
}
.btn:hover { opacity: 0.9; }

.btn-small {
  background-color: #f44336;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.input-group { margin-bottom: 15px; }
.input-group label { display: block; margin-bottom: 5px; }
.input-group input { width: 100%; padding: 8px; box-sizing: border-box; }

.error { color: red; text-align: center; }

.navbar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid #ccc; }

.stats-row { display: flex; justify-content: space-around; margin-bottom: 20px; }
.stat-card { background: var(--secondary-color); color: white; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 0 10px; }

.tabs { display: flex; margin-bottom: 20px; }
.tab-btn { flex: 1; padding: 10px; cursor: pointer; background: #ddd; border: none; font-size: 16px; }
.tab-btn.active { background: var(--primary-color); color: white; }

.tab-content { display: none; }
.tab-content.active { display: block; }

.inline-form { display: flex; gap: 10px; margin-bottom: 20px; }
.inline-form input { flex: 1; padding: 8px; }

.stacked-form input, .stacked-form label { display: block; width: 100%; margin-bottom: 10px; }
.stacked-form input[type="text"], .stacked-form input[type="datetime-local"] { padding: 8px; box-sizing: border-box; }

.candidate-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.candidate-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; text-align: center; }
.candidate-card img { max-width: 100%; height: 100px; object-fit: contain; margin-bottom: 10px; }
  `,

  'frontend/js/admin.js': `
const API_URL = '/api';

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      const res = await fetch(\`\${API_URL}/auth/login\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        window.location.href = '/admin-dashboard.html';
      } else {
        document.getElementById('errorMsg').innerText = data.message;
      }
    } catch (err) {
      document.getElementById('errorMsg').innerText = 'Server error';
    }
  });
}

// Dashboard Logic
if (window.location.pathname.includes('admin-dashboard')) {
  const token = localStorage.getItem('adminToken');
  if (!token) window.location.href = '/admin-login.html';

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
  });

  window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
  };

  const loadStats = async () => {
    const res = await fetch(\`\${API_URL}/admin/stats\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    const data = await res.json();
    document.getElementById('totalVoters').innerText = data.totalVoters;
    document.getElementById('votedVoters').innerText = data.votedVoters;
    document.getElementById('totalCandidates').innerText = data.candidates.length;
    renderCandidates(data.candidates);
  };

  const loadVoters = async () => {
    const res = await fetch(\`\${API_URL}/admin/voters\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    const voters = await res.json();
    const list = document.getElementById('voterList');
    list.innerHTML = voters.map(v => \`<li>\${v.email} - \${v.hasVoted ? 'Voted' : 'Not Voted'} <br/> \${v.votingToken ? \`Link: \${window.location.origin}/voting.html?token=\${v.votingToken}\` : ''}</li>\`).join('');
  };

  const loadSettings = async () => {
    const res = await fetch(\`\${API_URL}/admin/settings\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    const settings = await res.json();
    if(settings.startTime) document.getElementById('startTime').value = new Date(settings.startTime).toISOString().slice(0, 16);
    if(settings.endTime) document.getElementById('endTime').value = new Date(settings.endTime).toISOString().slice(0, 16);
    document.getElementById('votingEnabled').checked = settings.votingEnabled;
  };

  document.getElementById('addVoterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('voterEmail').value;
    await fetch(\`\${API_URL}/admin/voters\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
      body: JSON.stringify({ email })
    });
    loadVoters();
  });

  document.getElementById('generateLinksBtn').addEventListener('click', async () => {
    await fetch(\`\${API_URL}/admin/voters/generate-links\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    loadVoters();
    alert('Links generated');
  });

  document.getElementById('addCandidateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('candidateName').value);
    formData.append('party', document.getElementById('candidateParty').value);
    if(document.getElementById('candidateImage').files[0]) formData.append('image', document.getElementById('candidateImage').files[0]);
    if(document.getElementById('partyLogo').files[0]) formData.append('logo', document.getElementById('partyLogo').files[0]);

    await fetch(\`\${API_URL}/admin/candidates\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${token}\` },
      body: formData
    });
    loadStats();
  });

  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const votingEnabled = document.getElementById('votingEnabled').checked;

    await fetch(\`\${API_URL}/admin/settings\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
      body: JSON.stringify({ startTime, endTime, votingEnabled })
    });
    alert('Settings saved');
  });

  const renderCandidates = (candidates) => {
    const grid = document.getElementById('candidateList');
    grid.innerHTML = candidates.map(c => \`
      <div class="candidate-card">
        \${c.image ? \`<img src="\${c.image}" alt="\${c.name}">\` : ''}
        <h4>\${c.name}</h4>
        <p>\${c.party}</p>
        <button onclick="deleteCandidate('\${c._id}')" class="btn-small">Delete</button>
      </div>
    \`).join('');
  };

  window.deleteCandidate = async (id) => {
    await fetch(\`\${API_URL}/admin/candidates/\${id}\`, {
      method: 'DELETE',
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    loadStats();
  };

  loadStats();
  loadVoters();
  loadSettings();
}
  `,

  'frontend/js/voting.js': `
const API_URL = '/api';
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
  document.querySelector('.ballot-container').innerHTML = '<h2>Invalid Voting Link</h2>';
} else {
  const loadBallot = async () => {
    try {
      const res = await fetch(\`\${API_URL}/voter/ballot/\${token}\`);
      const data = await res.json();
      
      if (!res.ok) {
        document.querySelector('.ballot-container').innerHTML = \`<h2>\${data.message}</h2>\`;
        return;
      }

      document.getElementById('voterInfo').innerText = \`Voting as: \${data.email}\`;
      const grid = document.getElementById('ballotCandidates');
      grid.innerHTML = data.candidates.map(c => \`
        <div class="candidate-card">
          \${c.image ? \`<img src="\${c.image}" alt="\${c.name}">\` : ''}
          <h4>\${c.name}</h4>
          <p>\${c.party}</p>
          <button onclick="submitVote('\${c._id}')" class="btn">Vote</button>
        </div>
      \`).join('');
    } catch (err) {
      document.querySelector('.ballot-container').innerHTML = '<h2>Server error</h2>';
    }
  };

  window.submitVote = async (candidateId) => {
    if(!confirm('Are you sure you want to cast your vote for this candidate? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(\`\${API_URL}/voter/vote/\${token}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      });
      const data = await res.json();
      if (res.ok) {
        document.querySelector('.ballot-container').innerHTML = '<h2>Thank you! Your vote has been submitted successfully.</h2>';
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Server error');
    }
  };

  loadBallot();
}
  `,

  'frontend/js/results.js': `
const API_URL = '/api';
const socket = typeof io !== 'undefined' ? io() : null;

const renderResults = (candidates) => {
  const grid = document.getElementById('resultsGrid');
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  grid.innerHTML = candidates.map(c => {
    const percentage = totalVotes === 0 ? 0 : ((c.votes / totalVotes) * 100).toFixed(2);
    return \`
      <div class="candidate-card">
        \${c.image ? \`<img src="\${c.image}" alt="\${c.name}">\` : ''}
        <h4>\${c.name}</h4>
        <p>\${c.party}</p>
        <h3>\${c.votes} Votes</h3>
        <p>\${percentage}%</p>
      </div>
    \`;
  }).join('');
};

const loadResults = async () => {
  const res = await fetch(\`\${API_URL}/voter/results\`);
  const candidates = await res.json();
  renderResults(candidates);
};

loadResults();

if (socket) {
  socket.on('voteUpdate', (candidates) => {
    renderResults(candidates);
  });
}
  `
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\\n');
}

console.log('Frontend scaffolding complete.');
