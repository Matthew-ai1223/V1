const API_URL = '/api';
const socket = typeof io !== 'undefined' ? io() : null;

// ── Skeleton for results page ─────────────────────────────────────────────

const showResultsPageSkeleton = () => {
    // Stat card skeletons
    ['turnoutPercent', 'electionStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="skeleton" style="display:inline-block;width:60px;height:2rem;border-radius:6px;"></span>';
    });
    ['votedCount', 'totalCount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="skeleton" style="display:inline-block;width:30px;height:1rem;border-radius:4px;"></span>';
    });

    // Results grid skeleton
    const grid = document.getElementById('resultsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column:1/-1;">
            ${Array(2).fill(`
                <div style="margin-top:3rem;">
                    <div class="skeleton skeleton-title" style="width:30%;margin-bottom:2rem;"></div>
                    <div class="candidate-grid">
                        ${Array(3).fill(`
                            <div class="skeleton-card" style="background:white;padding:1.5rem;border-radius:20px;border:1px solid var(--border);text-align:center;">
                                <div class="skeleton" style="width:100px;height:100px;border-radius:50%;margin:0 auto 1rem;"></div>
                                <div class="skeleton skeleton-title" style="width:65%;margin:0 auto 8px;"></div>
                                <div class="skeleton skeleton-text" style="width:45%;height:0.75rem;margin:0 auto 1.5rem;"></div>
                                <div class="skeleton" style="width:100%;height:10px;border-radius:5px;margin-bottom:8px;"></div>
                                <div style="display:flex;justify-content:space-between;">
                                    <div class="skeleton" style="width:60px;height:0.8rem;border-radius:4px;"></div>
                                    <div class="skeleton" style="width:40px;height:0.8rem;border-radius:4px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

// ── Render real results ───────────────────────────────────────────────────

const renderResults = (data) => {
    const { candidates, stats } = data;
    const grid = document.getElementById('resultsGrid');
    
    // Update Global Stats
    if (stats) {
        const turnout = stats.totalVoters === 0 ? 0 : ((stats.votedVoters / stats.totalVoters) * 100).toFixed(1);
        document.getElementById('turnoutPercent').innerText = `${turnout}%`;
        document.getElementById('votedCount').innerText = stats.votedVoters;
        document.getElementById('totalCount').innerText = stats.totalVoters;
    }

    // Group candidates by category
    const grouped = candidates.reduce((acc, c) => {
        const cat = c.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(c);
        return acc;
    }, {});

    grid.innerHTML = Object.entries(grouped).map(([category, list]) => {
        const categoryTotal = list.reduce((sum, c) => sum + (c.votes || 0), 0);
        
        // Find the winner(s) in this category
        const maxVotes = Math.max(...list.map(c => c.votes || 0));
        
        return `
            <div class="category-result-section" style="grid-column: 1 / -1; margin-top: 3rem; animation: fadeIn 0.5s ease-out;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid var(--primary); margin-bottom: 2rem; padding-bottom: 0.5rem;">
                    <h3 style="margin-bottom: 0; color: var(--text-main); font-size: 1.5rem;">${category}</h3>
                    <span style="color: var(--text-muted); font-size: 0.875rem; font-weight: 600;">Total Category Votes: ${categoryTotal}</span>
                </div>
                <div class="candidate-grid">
                    ${list.sort((a, b) => (b.votes || 0) - (a.votes || 0)).map(c => {
                        const percentage = categoryTotal === 0 ? 0 : ((c.votes / categoryTotal) * 100).toFixed(1);
                        const isWinner = c.votes > 0 && c.votes === maxVotes;
                        
                        return `
                            <div class="candidate-card" style="position: relative; overflow: hidden; border: 2px solid ${isWinner ? 'var(--success)' : 'var(--border)'};">
                                ${isWinner ? `
                                    <div style="position: absolute; top: 10px; left: 10px; background: var(--success); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        👑 CURRENT LEADER
                                    </div>
                                ` : ''}
                                
                                ${c.image ? `<img src="${c.image}" alt="${c.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid #f1f5f9; margin-bottom: 1rem; ${isWinner ? 'border-color: var(--success);' : ''}">` : ''}
                                <h4 style="margin-bottom: 0.25rem;">${c.name}</h4>
                                <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">${c.party}</p>
                                
                                <div class="result-stat">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 700; font-size: 0.9rem;">
                                        <span>${c.votes || 0} Votes</span>
                                        <span style="color: ${isWinner ? 'var(--success)' : 'var(--primary)'};">${percentage}%</span>
                                    </div>
                                    <div class="progress-bg" style="background: #f1f5f9; height: 10px; border-radius: 5px;">
                                        <div class="progress-bar" style="width: ${percentage}%; background: ${isWinner ? 'var(--success)' : 'linear-gradient(to right, var(--primary), var(--accent))'}; height: 100%; border-radius: 5px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                                    </div>
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

// ── Load & init ───────────────────────────────────────────────────────────

const loadElectionSettings = async () => {
    try {
        const res = await fetch(`${API_URL}/voter/settings`);
        const data = await res.json();
        if (data.electionName) {
            document.title = `${data.electionName} | Live Results`;
            const header = document.getElementById('electionNameHeader');
            if (header) header.innerText = data.electionName;
        }
    } catch (err) { console.error('Settings load error:', err); }
};

const loadResults = async () => {
    loadElectionSettings();
    showResultsPageSkeleton();
    try {
        const res = await fetch(`${API_URL}/voter/results`);
        const data = await res.json();
        
        if (!res.ok) {
            // Restore stat card defaults if results hidden
            const turnoutEl = document.getElementById('turnoutPercent');
            if (turnoutEl) turnoutEl.innerText = '—';
            const statusEl = document.getElementById('electionStatus');
            if (statusEl) { statusEl.innerText = 'PENDING'; statusEl.style.color = 'var(--text-muted)'; }
            ['votedCount', 'totalCount'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = '0';
            });

            document.getElementById('resultsGrid').innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: white; border-radius: 24px; box-shadow: var(--shadow);">
                    <div style="margin-bottom: 1.5rem; color: var(--primary); display: flex; justify-content: center;">
                        <i data-lucide="archive" style="width: 64px; height: 64px;"></i>
                    </div>
                    <h2 style="color: var(--text-main); margin-bottom: 1rem;">Results Not Released</h2>
                    <p style="color: var(--text-muted); font-size: 1.1rem;">${data.message || 'The administrator has not yet released the live election results.'}</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }
        
        renderResults(data);
    } catch (err) {
        console.error('Error loading results:', err);
        if (typeof ui !== 'undefined') ui.showToast('Failed to load live results', 'error');
    }
};

loadResults();

if (socket) {
    socket.on('voteUpdate', (candidates) => {
        renderResults(candidates);
    });
}