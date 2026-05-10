const API_URL = '/api';

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    ui.showLoading();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        window.location.href = '/admin-dashboard.html';
      } else {
        ui.showToast(data.message, 'error');
        document.getElementById('errorMsg').innerText = data.message;
      }
    } catch (err) {
      console.error('Login error:', err);
      ui.showToast('Server connection failed. Please check your internet and console.', 'error');
    } finally {
      ui.hideLoading();
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
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    document.getElementById('totalVoters').innerText = data.totalVoters;
    document.getElementById('votedVoters').innerText = data.votedVoters;
    document.getElementById('totalCandidates').innerText = data.candidates.length;
    renderCandidates(data.candidates);
  };

  const loadVoters = async () => {
    const res = await fetch(`${API_URL}/admin/voters`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const voters = await res.json();
    const list = document.getElementById('voterList');
    list.innerHTML = voters.map(v => `
      <li>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>${v.email}</strong>
          <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; 
            background: ${v.hasVoted ? '#dcfce7' : '#f1f5f9'}; color: ${v.hasVoted ? '#166534' : '#475569'};">
            ${v.hasVoted ? 'Voted' : 'Pending'}
          </span>
        </div>
        ${v.votingToken ? `
          <div style="margin-top: 8px; font-size: 0.875rem;">
            <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; display: block; word-break: break-all;">
              ${window.location.origin}/voting.html?token=${v.votingToken}
            </code>
          </div>` : ''}
      </li>`).join('');
  };

  const loadSettings = async () => {
    const res = await fetch(`${API_URL}/admin/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const settings = await res.json();
    if(settings.startTime) document.getElementById('startTime').value = new Date(settings.startTime).toISOString().slice(0, 16);
    if(settings.endTime) document.getElementById('endTime').value = new Date(settings.endTime).toISOString().slice(0, 16);
    document.getElementById('votingEnabled').checked = settings.votingEnabled;
    document.getElementById('showResults').checked = settings.showResults;
  };

  document.getElementById('addVoterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    ui.showLoading();
    const email = document.getElementById('voterEmail').value;
    try {
        const res = await fetch(`${API_URL}/admin/voters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            ui.showToast('Voter added successfully');
            loadVoters();
            e.target.reset();
        } else {
            ui.showToast(data.message, 'error');
        }
    } catch (err) {
        ui.showToast('Failed to add voter', 'error');
    } finally {
        ui.hideLoading();
    }
  });

  document.getElementById('bulkVoterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('csvFile');
    if (!fileInput.files[0]) return;

    ui.showLoading();
    const formData = new FormData();
    formData.append('csvFile', fileInput.files[0]);

    try {
      const res = await fetch(`${API_URL}/admin/voters/bulk-csv`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
          ui.showToast(data.message);
          loadVoters();
          loadStats();
          e.target.reset();
      } else {
          ui.showToast(data.message, 'error');
      }
    } catch (err) {
      ui.showToast('Error uploading CSV', 'error');
    } finally {
        ui.hideLoading();
    }
  });

  document.getElementById('generateLinksBtn').addEventListener('click', async () => {
    if (!confirm('This will send emails to all voters. Continue?')) return;
    ui.showLoading();
    try {
        const res = await fetch(`${API_URL}/admin/voters/generate-links`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            ui.showToast('Links generated and emails sent');
            loadVoters();
        } else {
            ui.showToast(data.message, 'error');
        }
    } catch (err) {
        ui.showToast('Failed to generate links', 'error');
    } finally {
        ui.hideLoading();
    }
  });

  document.getElementById('addCandidateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    ui.showLoading();
    const formData = new FormData();
    formData.append('name', document.getElementById('candidateName').value);
    formData.append('party', document.getElementById('candidateParty').value);
    formData.append('category', document.getElementById('candidateCategory').value);
    if(document.getElementById('candidateImage').files[0]) formData.append('image', document.getElementById('candidateImage').files[0]);
    if(document.getElementById('partyLogo').files[0]) formData.append('logo', document.getElementById('partyLogo').files[0]);

    try {
        const res = await fetch(`${API_URL}/admin/candidates`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (res.ok) {
            ui.showToast('Candidate added successfully');
            loadStats();
            e.target.reset();
        } else {
            const data = await res.json();
            ui.showToast(data.message, 'error');
        }
    } catch (err) {
        ui.showToast('Failed to add candidate', 'error');
    } finally {
        ui.hideLoading();
    }
  });

  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    ui.showLoading();
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const votingEnabled = document.getElementById('votingEnabled').checked;
    const showResults = document.getElementById('showResults').checked;

    try {
        const res = await fetch(`${API_URL}/admin/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ startTime, endTime, votingEnabled, showResults })
        });
        if (res.ok) {
            ui.showToast('Settings saved successfully');
        } else {
            ui.showToast('Failed to save settings', 'error');
        }
    } catch (err) {
        ui.showToast('Server error', 'error');
    } finally {
        ui.hideLoading();
    }
  });

  const renderCandidates = (candidates) => {
    const grid = document.getElementById('candidateList');
    
    // Group candidates by category
    const grouped = candidates.reduce((acc, c) => {
        const cat = c.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(c);
        return acc;
    }, {});

    grid.innerHTML = Object.entries(grouped).map(([category, list]) => `
      <div class="category-section" style="grid-column: 1 / -1; margin-top: 2rem;">
        <h3 style="border-left: 4px solid var(--primary); padding-left: 10px; margin-bottom: 1rem;">${category}</h3>
        <div class="candidate-grid">
          ${list.map(c => `
            <div class="candidate-card">
              ${c.image ? `<img src="${c.image}" alt="${c.name}">` : ''}
              <h4>${c.name}</h4>
              <p>${c.party}</p>
              <button onclick="deleteCandidate('${c._id}')" class="btn-small">Delete</button>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  };

  window.deleteCandidate = async (id) => {
    if (!confirm('Are you sure?')) return;
    ui.showLoading();
    try {
        const res = await fetch(`${API_URL}/admin/candidates/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            ui.showToast('Candidate deleted');
            loadStats();
        } else {
            ui.showToast('Failed to delete', 'error');
        }
    } catch (err) {
        ui.showToast('Server error', 'error');
    } finally {
        ui.hideLoading();
    }
  };

  const populateGlobalLink = () => {
    const linkInput = document.getElementById('globalLink');
    if (linkInput) {
        linkInput.value = `${window.location.origin}/voting.html`;
    }
  };

  window.copyGlobalLink = () => {
    const linkInput = document.getElementById('globalLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(linkInput.value);
    ui.showToast('Global link copied to clipboard!');
  };

  loadStats();
  loadVoters();
  loadSettings();
  populateGlobalLink();
};

window.resetSystemData = async () => {
    if (!confirm('CRITICAL WARNING: This will permanently delete ALL data (voters, candidates, and results). This action cannot be undone. Are you absolutely sure?')) return;
    
    const confirmText = prompt('To confirm deletion, please type "DELETE" in the box below:');
    if (confirmText !== 'DELETE') {
        ui.showToast('Reset cancelled: Confirmation text did not match.', 'error');
        return;
    }

    const token = localStorage.getItem('adminToken');
    ui.showLoading();
    try {
        const res = await fetch(`${API_URL}/admin/reset`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            ui.showToast('System has been fully reset successfully');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            ui.showToast(data.message, 'error');
        }
    } catch (err) {
        ui.showToast('Reset failed. Check server connection.', 'error');
    } finally {
        ui.hideLoading();
    }
};