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

  // ── Skeleton helpers ──────────────────────────────────────────────────

  const showStatSkeletons = () => {
    ['totalVoters', 'votedVoters'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<span class="skeleton skeleton-text" style="width:50px;height:1.5rem;display:inline-block;border-radius:4px;"></span>';
    });
  };

  const showVoterListSkeleton = () => {
    const list = document.getElementById('voterList');
    if (!list) return;
    list.innerHTML = Array(5).fill(`
      <li style="background:#f8fafc;padding:1rem;border-radius:12px;border:1px solid var(--border);list-style:none;">
        <div class="skeleton skeleton-text" style="width:65%;margin-bottom:10px;"></div>
        <div class="skeleton skeleton-text" style="width:40%;height:0.75rem;"></div>
      </li>
    `).join('');
  };

  const showCategoryListSkeleton = () => {
    const list = document.getElementById('categoryList');
    if (!list) return;
    list.innerHTML = Array(4).fill(`
      <div class="skeleton-card" style="background:white;padding:1.5rem;border-radius:16px;border:1px solid var(--border);">
        <div class="skeleton skeleton-title" style="width:70%;margin-bottom:10px;"></div>
        <div class="skeleton skeleton-text" style="width:50%;height:0.75rem;"></div>
      </div>
    `).join('');
  };

  const showCandidateListSkeleton = () => {
    const grid = document.getElementById('candidateList');
    if (!grid) return;
    grid.innerHTML = `
      <div style="margin-bottom:3rem;">
        <div class="skeleton skeleton-title" style="width:30%;margin-bottom:1.5rem;"></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1.5rem;">
          ${Array(3).fill(`
            <div class="skeleton-card" style="background:white;padding:1.5rem;border-radius:20px;border:1px solid var(--border);text-align:center;">
              <div class="skeleton skeleton-avatar" style="width:80px;height:80px;margin:0 auto 1rem;"></div>
              <div class="skeleton skeleton-title" style="width:60%;margin:0 auto 8px;"></div>
              <div class="skeleton skeleton-text" style="width:45%;margin:0 auto 1rem;height:0.75rem;"></div>
              <div class="skeleton skeleton-button" style="width:100%;height:36px;"></div>
            </div>
          `).join('')}
        </div>
      </div>`;
  };

  const showResultsSkeleton = () => {
    const grid = document.getElementById('adminResultsGrid');
    if (!grid) return;
    grid.innerHTML = `
      <div style="margin-bottom:3rem;background:#f8fafc;padding:1.5rem;border-radius:20px;border:1px solid var(--border);">
        <div class="skeleton skeleton-title" style="width:35%;margin-bottom:1.5rem;"></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;">
          ${Array(3).fill(`
            <div class="skeleton-card" style="background:white;padding:1.25rem;border-radius:16px;border:1px solid var(--border);">
              <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
                <div class="skeleton" style="width:50px;height:50px;border-radius:50%;flex-shrink:0;"></div>
                <div style="flex:1;">
                  <div class="skeleton skeleton-text" style="width:70%;margin-bottom:6px;"></div>
                  <div class="skeleton skeleton-text" style="width:45%;height:0.7rem;"></div>
                </div>
              </div>
              <div class="skeleton skeleton-text" style="width:100%;height:8px;border-radius:4px;"></div>
            </div>
          `).join('')}
        </div>
      </div>`;
  };

  // ── Data Loaders ──────────────────────────────────────────────────────

  const loadStats = async () => {
    showStatSkeletons();
    showCandidateListSkeleton();
    showResultsSkeleton();
    try {
        const res = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('totalVoters').innerText = data.totalVoters;
            document.getElementById('votedVoters').innerText = data.votedVoters;
            renderCandidates(data.candidates);
            renderAdminResults(data.candidates);
        }
    } catch (err) { console.error('Stats error:', err); }
  };

  const renderAdminResults = (candidates) => {
    const grid = document.getElementById('adminResultsGrid');
    if (!grid) return;

    const grouped = candidates.reduce((acc, c) => {
        const cat = c.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(c);
        return acc;
    }, {});

    if (Object.keys(grouped).length === 0) {
      grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">No candidates found.</p>';
      return;
    }

    grid.innerHTML = Object.entries(grouped).map(([category, list]) => {
        const categoryTotal = list.reduce((sum, c) => sum + (c.votes || 0), 0);
        const maxVotes = Math.max(...list.map(c => c.votes || 0));

        return `
            <div style="margin-bottom: 3rem; background: #f8fafc; padding: 1.5rem; border-radius: 20px; border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid var(--primary); margin-bottom: 1.5rem; padding-bottom: 0.5rem;">
                    <h3 style="margin: 0;">${category}</h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Total Votes: ${categoryTotal}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${list.sort((a, b) => (b.votes || 0) - (a.votes || 0)).map(c => {
                        const percentage = categoryTotal === 0 ? 0 : ((c.votes / categoryTotal) * 100).toFixed(1);
                        const isWinner = c.votes > 0 && c.votes === maxVotes;
                        return `
                            <div class="card" style="padding: 1.25rem; border: 2px solid ${isWinner ? 'var(--success)' : 'var(--border)'};">
                                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                    ${c.image ? `<img src="${c.image}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">` : `
                                        <div class="candidate-no-image small">
                                            <i data-lucide="user"></i>
                                        </div>
                                    `}
                                    <div>
                                        <h4 style="margin: 0;">${c.name}</h4>
                                        <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">${c.party}</p>
                                    </div>
                                    ${isWinner ? '<i data-lucide="trophy" style="width: 18px; height: 18px; color: var(--success); margin-left: auto;"></i>' : ''}
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 700; font-size: 0.8rem;">
                                    <span>${c.votes || 0} Votes</span>
                                    <span>${percentage}%</span>
                                </div>
                                <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${percentage}%; background: ${isWinner ? 'var(--success)' : 'var(--primary)'}; height: 100%;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  const loadCategories = async () => {
    showCategoryListSkeleton();
    try {
        const res = await fetch(`${API_URL}/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await res.json();
        
        // Update Categories List Tab
        const list = document.getElementById('categoryList');
        if (list) {
            if (categories.length === 0) {
              list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">No categories yet. Add one above.</p>';
            } else {
              list.innerHTML = categories.map(c => `
                  <div class="card" style="padding: 1.5rem; position: relative; border-radius: 16px; border: 1px solid var(--border);">
                      <h4 style="margin-bottom: 5px;">${c.name}</h4>
                      <p style="font-size: 0.8rem; color: var(--text-muted);">${c.description || 'No description'}</p>
                      <button onclick="deleteCategory('${c._id}')" style="position: absolute; top: 15px; right: 15px; border: none; background: none; color: var(--danger); cursor: pointer;">
                          <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                      </button>
                  </div>
              `).join('');
            }
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
    showVoterListSkeleton();
    try {
        const res = await fetch(`${API_URL}/admin/voters`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const voters = await res.json();
        const list = document.getElementById('voterList');
        if (list) {
            if (voters.length === 0) {
              list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;grid-column:1/-1;">No voters registered yet.</p>';
            } else {
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
        }
    } catch (err) { console.error('Voters error:', err); }
  };

  const loadSettings = async () => {
    try {
        const res = await fetch(`${API_URL}/admin/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const settings = await res.json();
        
        if (settings.electionName) {
            document.getElementById('electionName').value = settings.electionName;
            const display = document.getElementById('electionTitleDisplay');
            if (display) display.innerText = settings.electionName;
        }
        
        if (settings.startTime) {
            const start = new Date(settings.startTime);
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

  // ── Event Listeners ───────────────────────────────────────────────────

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
    
    const startTimeVal = document.getElementById('startTime').value;
    const endTimeVal = document.getElementById('endTime').value;
    
    const body = {
        electionName: document.getElementById('electionName').value,
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
        if (res.ok) {
            ui.showToast('Settings saved and synchronized with server time');
            const display = document.getElementById('electionTitleDisplay');
            if (display) display.innerText = body.electionName;
        }
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

    if (Object.keys(grouped).length === 0) {
      grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">No candidates added yet.</p>';
      return;
    }

    grid.innerHTML = Object.entries(grouped).map(([category, list]) => `
        <div style="margin-bottom: 3rem;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid var(--primary); margin-bottom: 1.5rem; padding-bottom: 0.5rem;">
                <h3 style="margin: 0;">${category}</h3>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${list.length} Candidates</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
                ${list.map(c => `
                    <div class="card" style="padding: 1.5rem; text-align: center; border-radius: 20px; border: 1px solid var(--border);">
                        ${c.image ? `<img src="${c.image}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; border: 3px solid #f1f5f9;">` : `
                            <div class="candidate-no-image" style="width: 80px; height: 80px;">
                                <i data-lucide="user"></i>
                            </div>
                        `}
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

  // ── Init ──────────────────────────────────────────────────────────────
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

  window.downloadResultsPDF = () => {
    const element = document.getElementById('adminResultsGrid');
    if (!element || element.innerHTML === '') {
        return ui.showToast('No results available to download', 'error');
    }

    const options = {
        margin: 0.5,
        filename: `Election_Results_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    ui.showLoading();
    html2pdf().set(options).from(element).save().then(() => {
        ui.hideLoading();
        ui.showToast('PDF Report downloaded successfully');
    }).catch(err => {
        console.error('PDF error:', err);
        ui.hideLoading();
        ui.showToast('Failed to generate PDF', 'error');
    });
  };

  window.previewUTC = (inputId, displayId) => {
    const val = document.getElementById(inputId).value;
    const display = document.getElementById(displayId);
    if (val) {
        const utc = new Date(val).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
        display.innerText = `Translates to: ${utc}`;
    } else {
        display.innerText = '';
    }
  };

  window.setStartTimeToNow = () => {
    const now = new Date();
    const past = new Date(now.getTime() - (now.getTimezoneOffset() * 60000) - 120000);
    const localISO = past.toISOString().slice(0, 16);
    const input = document.getElementById('startTime');
    if (input) {
        input.value = localISO;
        window.previewUTC('startTime', 'startTimeUTC');
        ui.showToast('Time set to 2 minutes ago (Start Immediately)');
    }
  };

  window.toggleHelp = () => {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  };
}

window.resetSystemData = async () => {
    const options = {
        voters: document.getElementById('clearVoters').checked,
        candidates: document.getElementById('clearCandidates').checked,
        categories: document.getElementById('clearCategories').checked,
        settings: document.getElementById('resetSettings').checked,
        votes: document.getElementById('clearVotes').checked
    };

    const selectedCount = Object.values(options).filter(v => v).length;
    if (selectedCount === 0) {
        return ui.showToast('Please select at least one item to clear', 'error');
    }

    if (!confirm(`CRITICAL WARNING: This will permanently delete the selected ${selectedCount} data type(s). Are you absolutely sure?`)) return;
    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return ui.showToast('Reset cancelled', 'error');

    const token = localStorage.getItem('adminToken');
    ui.showLoading();
    try {
        const res = await fetch(`${API_URL}/admin/reset`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(options)
        });
        if (res.ok) {
            ui.showToast('System data cleared successfully');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            const data = await res.json();
            ui.showToast(data.message || 'Reset failed', 'error');
        }
    } catch (err) { ui.showToast('Reset failed', 'error'); }
    finally { ui.hideLoading(); }
};

window.copyGlobalLink = () => {
    const el = document.getElementById('globalLink');
    if (!el) return;
    navigator.clipboard.writeText(el.value).then(() => {
        ui.showToast('Link copied to clipboard!');
    }).catch(() => {
        el.select();
        document.execCommand('copy');
        ui.showToast('Link copied!');
    });
};