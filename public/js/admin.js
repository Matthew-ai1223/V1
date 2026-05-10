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
      }
    } catch (err) {
      console.error('Login error:', err);
      ui.showToast('Server connection failed.', 'error');
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

  // Handle Tab Switching with Sidebar Support
  window.showTab = (tabId, btnEl) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if (btnEl) btnEl.classList.add('active');
  };

  const loadStats = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('totalVoters').innerText = data.totalVoters;
            document.getElementById('votedVoters').innerText = data.votedVoters;
            renderCandidates(data.candidates);
        }
    } catch (err) { console.error('Stats error:', err); }
  };

  const loadCategories = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await res.json();
        
        // Update Categories List Tab
        const list = document.getElementById('categoryList');
        if (list) {
            list.innerHTML = categories.map(c => `
                <div class="card" style="padding: 1.5rem; position: relative; border-radius: 16px; border: 1px solid var(--border);">
                    <h4 style="margin-bottom: 5px;">${c.name}</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">${c.description || 'No description'}</p>
                    <button onclick="deleteCategory('${c._id}')" style="position: absolute; top: 15px; right: 15px; border: none; background: none; color: var(--danger); cursor: pointer;">
                        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
            `).join('');
            lucide.createIcons();
        }

        // Update Candidate Form Dropdown
        const select = document.getElementById('candidateCategory');
        if (select) {
            const currentVal = select.value;
            select.innerHTML = '<option value="">Select a category...</option>' + 
                categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            select.value = currentVal;
        }
    } catch (err) { console.error('Categories load error:', err); }
  };

  window.deleteCategory = async (id) => {
    if (!confirm('Are you sure? This will not delete candidates in this category but will remove the category from the system.')) return;
    try {
        const res = await fetch(`${API_URL}/admin/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            ui.showToast('Category removed');
            loadCategories();
        }
    } catch (err) { ui.showToast('Error deleting category', 'error'); }
  };

  const loadVoters = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/voters`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const voters = await res.json();
        const list = document.getElementById('voterList');
        if (list) {
            list.innerHTML = voters.map(v => `
                <li style="background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1px solid var(--border); list-style: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 0.9rem;">${v.email}</strong>
                        <span style="padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; background: ${v.hasVoted ? '#dcfce7' : '#e2e8f0'}; color: ${v.hasVoted ? '#166534' : '#475569'};">
                            ${v.hasVoted ? 'VOTED' : 'PENDING'}
                        </span>
                    </div>
                    ${v.votingToken ? `
                        <div style="font-family: monospace; font-size: 0.75rem; color: var(--text-muted); word-break: break-all; background: white; padding: 6px; border-radius: 6px; border: 1px solid var(--border);">
                            ${window.location.origin}/voting.html?token=${v.votingToken}
                        </div>
                    ` : ''}
                </li>
            `).join('');
        }
    } catch (err) { console.error('Voters error:', err); }
  };

  const loadSettings = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const settings = await res.json();
        
        if (settings.startTime) {
            const start = new Date(settings.startTime);
            // Convert UTC to local format for datetime-local input (YYYY-MM-DDTHH:mm)
            const localStart = new Date(start.getTime() - (start.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            document.getElementById('startTime').value = localStart;
        }
        if (settings.endTime) {
            const end = new Date(settings.endTime);
            const localEnd = new Date(end.getTime() - (end.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            document.getElementById('endTime').value = localEnd;
        }
        document.getElementById('votingEnabled').checked = settings.votingEnabled;
        document.getElementById('showResults').checked = settings.showResults;
    } catch (err) { console.error('Settings error:', err); }
  };

  // Event Listeners
  document.getElementById('addVoterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    ui.showLoading();
    try {
        const res = await fetch(`${API_URL}/admin/voters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ email: document.getElementById('voterEmail').value })
        });
        if (res.ok) {
            ui.showToast('Voter added');
            loadVoters();
            e.target.reset();
        } else {
            const data = await res.json();
            ui.showToast(data.message, 'error');
        }
    } catch (err) { ui.showToast('Error adding voter', 'error'); }
    finally { ui.hideLoading(); }
  });

  document.getElementById('generateLinksBtn')?.addEventListener('click', async () => {
    if (!confirm('This will generate unique voting tokens and send email invitations to all registered voters. Continue?')) return;
    ui.showLoading();
    try {
        const res = await fetch(`${API_URL}/admin/voters/generate-links`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            ui.showToast('Voting links generated and emails sent successfully');
            loadVoters();
        } else {
            ui.showToast(data.message || 'Failed to generate links', 'error');
        }
    } catch (err) {
        ui.showToast('Server error while generating links', 'error');
    } finally {
        ui.hideLoading();
    }
  });

  document.getElementById('addCategoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    ui.showLoading();
    try {
        const name = document.getElementById('catName').value;
        const description = document.getElementById('catDesc').value;
        const res = await fetch(`${API_URL}/admin/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, description })
        });
        if (res.ok) {
            ui.showToast('Category added');
            loadCategories();
            e.target.reset();
        } else {
            const data = await res.json();
            ui.showToast(data.message, 'error');
        }
    } catch (err) { ui.showToast('Error adding category', 'error'); }
    finally { ui.hideLoading(); }
  });

  document.getElementById('addCandidateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    ui.showLoading();
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('candidateName').value);
        formData.append('party', document.getElementById('candidateParty').value);
        formData.append('category', document.getElementById('candidateCategory').value);
        const imageFile = document.getElementById('candidateImage').files[0];
        if (imageFile) formData.append('image', imageFile);

        const res = await fetch(`${API_URL}/admin/candidates`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (res.ok) {
            ui.showToast('Candidate added');
            loadStats();
            e.target.reset();
        } else {
            const data = await res.json();
            ui.showToast(data.message, 'error');
        }
    } catch (err) { ui.showToast('Error adding candidate', 'error'); }
    finally { ui.hideLoading(); }
  });

  document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    ui.showLoading();
    
    // Normalize times to UTC before sending to server
    const startTimeVal = document.getElementById('startTime').value;
    const endTimeVal = document.getElementById('endTime').value;
    
    const body = {
        startTime: startTimeVal ? new Date(startTimeVal).toISOString() : null,
        endTime: endTimeVal ? new Date(endTimeVal).toISOString() : null,
        votingEnabled: document.getElementById('votingEnabled').checked,
        showResults: document.getElementById('showResults').checked
    };
    
    try {
        const res = await fetch(`${API_URL}/admin/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        if (res.ok) ui.showToast('Settings saved and synchronized with server time');
    } catch (err) { ui.showToast('Error saving settings', 'error'); }
    finally { ui.hideLoading(); }
  });

  const renderCandidates = (candidates) => {
    const grid = document.getElementById('candidateList');
    if (!grid) return;

    const grouped = candidates.reduce((acc, c) => {
        const cat = c.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(c);
        return acc;
    }, {});

    grid.innerHTML = Object.entries(grouped).map(([category, list]) => `
        <div style="margin-bottom: 3rem;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid var(--primary); margin-bottom: 1.5rem; padding-bottom: 0.5rem;">
                <h3 style="margin: 0;">${category}</h3>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${list.length} Candidates</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
                ${list.map(c => `
                    <div class="card" style="padding: 1.5rem; text-align: center; border-radius: 20px; border: 1px solid var(--border);">
                        ${c.image ? `<img src="${c.image}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; border: 3px solid #f1f5f9;">` : ''}
                        <h4 style="margin-bottom: 5px;">${c.name}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">${c.party}</p>
                        <button onclick="deleteCandidate('${c._id}')" class="btn-small" style="background: #fee2e2; color: #991b1b; border: none; width: 100%;">Delete</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
  };

  window.deleteCandidate = async (id) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    ui.showLoading();
    try {
        const res = await fetch(`${API_URL}/admin/candidates/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            ui.showToast('Candidate deleted');
            loadStats();
        }
    } catch (err) { ui.showToast('Error deleting candidate', 'error'); }
    finally { ui.hideLoading(); }
  };

  const populateGlobalLink = () => {
    const el = document.getElementById('globalLink');
    if (el) el.value = `${window.location.origin}/voting.html`;
  };

  // Init
  loadStats();
  loadVoters();
  loadCategories();
  loadSettings();
  populateGlobalLink();

  // Update Live Server Time Display
  setInterval(() => {
    const display = document.getElementById('serverTimeDisplay');
    if (display) {
        display.innerText = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    }
  }, 1000);
}

window.resetSystemData = async () => {
    if (!confirm('CRITICAL WARNING: This will permanently delete ALL data. Are you absolutely sure?')) return;
    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return ui.showToast('Reset cancelled', 'error');

    const token = localStorage.getItem('adminToken');
    ui.showLoading();
    try {
        const res = await fetch(`${API_URL}/admin/reset`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            ui.showToast('System reset successful');
            setTimeout(() => window.location.reload(), 1000);
        }
    } catch (err) { ui.showToast('Reset failed', 'error'); }
    finally { ui.hideLoading(); }
};