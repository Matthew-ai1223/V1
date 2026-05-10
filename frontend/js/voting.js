const API_URL = '/api';
const urlParams = new URLSearchParams(window.location.search);
const isPreview = urlParams.get('preview') === 'true';
let currentToken = urlParams.get('token');

const authSection = document.getElementById('authSection');
const ballotSection = document.getElementById('ballotSection');
const voterAuthForm = document.getElementById('voterAuthForm');
const voterInfo = document.getElementById('voterInfo');

const init = () => {
    if (isPreview) {
        voterInfo.innerText = "PREVIEW MODE (Admin)";
        loadBallot();
        return;
    }

    if (currentToken) {
        loadBallot();
    } else {
        authSection.style.display = 'block';
    }
};

voterAuthForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    
    ui.showLoading();
    try {
        const res = await fetch(`${API_URL}/voter/auth-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        if (res.ok) {
            currentToken = data.token;
            voterInfo.innerText = `Voting as: ${data.email}`;
            authSection.style.display = 'none';
            loadBallot();
        } else {
            ui.showToast(data.message, 'error');
        }
    } catch (err) {
        ui.showToast('Server error during authentication', 'error');
    } finally {
        ui.hideLoading();
    }
});

let selectedCandidates = {}; // { category: candidateId }
let allCategories = [];
let loadedCandidates = []; // Global store for candidates

const renderBallot = () => {
    const grid = document.getElementById('ballotCandidates');
    if (!loadedCandidates || loadedCandidates.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 2rem;">No candidates available for this election.</p>';
        return;
    }
    
    // Group candidates by category
    const grouped = loadedCandidates.reduce((acc, c) => {
        const cat = c.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(c);
        return acc;
    }, {});

    allCategories = Object.keys(grouped);

    grid.innerHTML = `
        <div class="ballot-form">
            ${Object.entries(grouped).map(([category, list]) => `
                <div class="category-block" style="margin-bottom: 3rem; background: rgba(255,255,255,0.5); padding: 1.5rem; border-radius: 20px;">
                    <h3 style="border-bottom: 2px solid var(--primary); padding-bottom: 8px; margin-bottom: 1.5rem; color: var(--text-main); display: flex; justify-content: space-between; align-items: center;">
                        ${category}
                        ${selectedCandidates[category] ? '<span style="font-size: 0.8rem; background: var(--success); color: white; padding: 2px 8px; border-radius: 12px;">Selected</span>' : '<span style="font-size: 0.8rem; background: var(--text-muted); color: white; padding: 2px 8px; border-radius: 12px;">Selection Required</span>'}
                    </h3>
                    <div class="candidate-grid">
                        ${list.map(c => `
                            <div class="candidate-card voter-card ${selectedCandidates[category] === c._id ? 'selected' : ''}" 
                                 onclick="${isPreview ? '' : `selectCandidate('${category.replace(/'/g, "\\'")}', '${c._id}')`}" 
                                 style="cursor: pointer; position: relative; border-width: 2px; ${selectedCandidates[category] === c._id ? 'border-color: var(--primary); background: #f5f3ff;' : ''}">
                                ${c.image ? `<img src="${c.image}" alt="${c.name}" style="width: 100px; height: 100px; margin-bottom: 1rem;">` : ''}
                                <h4 style="margin-bottom: 0.25rem;">${c.name}</h4>
                                <p style="font-size: 0.875rem;">${c.party}</p>
                                <div style="margin-top: 1rem; font-weight: 600; color: ${selectedCandidates[category] === c._id ? 'var(--primary)' : 'var(--text-muted)'};">
                                    ${selectedCandidates[category] === c._id ? '✓ Selected' : 'Choose Candidate'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            
            ${!isPreview ? `
                <div style="text-align: center; margin-top: 4rem; padding: 2rem; background: white; border-radius: 24px; box-shadow: var(--shadow); border: 2px solid var(--border);">
                    <h4 style="margin-bottom: 1rem;">Ready to finalize?</h4>
                    <p style="margin-bottom: 2rem; color: var(--text-muted);">You have selected ${Object.keys(selectedCandidates).length} out of ${allCategories.length} categories.</p>
                    <button onclick="submitFinalVotes()" class="btn" style="width: 100%; max-width: 400px; height: 60px; font-size: 1.25rem; background: linear-gradient(to right, var(--primary), var(--accent));">Submit All Selections</button>
                </div>
            ` : ''}
        </div>
    `;
};

window.selectCandidate = (category, candidateId) => {
    selectedCandidates[category] = candidateId;
    renderBallot();
};

window.submitFinalVotes = async () => {
    const unvotedCategories = allCategories.filter(cat => !selectedCandidates[cat]);
    
    if (unvotedCategories.length > 0) {
        ui.showToast(`Please select a candidate for: ${unvotedCategories.join(', ')}`, 'error');
        return;
    }

    if(!confirm('Submit your final selections? This action cannot be undone.')) return;
    
    ui.showLoading();
    try {
        const candidateIds = Object.values(selectedCandidates);
        const res = await fetch(`${API_URL}/voter/vote/${currentToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateIds })
        });
        const data = await res.json();
        if (res.ok) {
            ui.showToast('All votes cast successfully');
            document.querySelector('.ballot-container').innerHTML = `
                <div style="text-align: center; animation: fadeIn 0.5s ease-out; padding: 3rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                    <h2 style="color: var(--success); font-size: 2.5rem; margin-bottom: 1rem;">Thank You!</h2>
                    <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 2.5rem;">Your votes for all ${allCategories.length} categories have been securely recorded.</p>
                    <a href="/results.html" class="btn btn-large" style="padding: 1rem 2.5rem;">View Live Results</a>
                </div>
            `;
        } else {
            ui.showToast(data.message, 'error');
        }
    } catch (err) {
        ui.showToast('Server error during voting', 'error');
    } finally {
        ui.hideLoading();
    }
};

// Update loadBallot to populate loadedCandidates
const loadBallot = async () => {
    ballotSection.style.display = 'none';
    ui.showLoading();
    try {
        const url = isPreview ? `${API_URL}/voter/results` : `${API_URL}/voter/ballot/${currentToken}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!res.ok) {
            document.querySelector('.ballot-container').innerHTML = `<h2>${data.message}</h2>`;
            return;
        }

        loadedCandidates = isPreview ? data : data.candidates;
        renderBallot();
        ballotSection.style.display = 'block';
    } catch (err) {
        ui.showToast('Server error', 'error');
    } finally {
        ui.hideLoading();
    }
};

init();