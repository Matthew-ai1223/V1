const API_URL = '/api';
const socket = typeof io !== 'undefined' ? io() : null;

const renderResults = (candidates) => {
    const grid = document.getElementById('resultsGrid');
    
    // Group candidates by category
    const grouped = candidates.reduce((acc, c) => {
        const cat = c.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(c);
        return acc;
    }, {});

    grid.innerHTML = Object.entries(grouped).map(([category, list]) => {
        const categoryTotal = list.reduce((sum, c) => sum + (c.votes || 0), 0);
        
        return `
            <div class="category-result-section" style="grid-column: 1 / -1; margin-top: 3rem; animation: fadeIn 0.5s ease-out;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid var(--primary); margin-bottom: 2rem; padding-bottom: 0.5rem;">
                    <h3 style="margin-bottom: 0; color: var(--text-main);">${category}</h3>
                    <span style="color: var(--text-muted); font-size: 0.875rem; font-weight: 600;">Total Votes: ${categoryTotal}</span>
                </div>
                <div class="candidate-grid">
                    ${list.map(c => {
                        const percentage = categoryTotal === 0 ? 0 : ((c.votes / categoryTotal) * 100).toFixed(1);
                        return `
                            <div class="candidate-card" style="position: relative; overflow: hidden;">
                                ${c.image ? `<img src="${c.image}" alt="${c.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid #f1f5f9; margin-bottom: 1rem;">` : ''}
                                <h4 style="margin-bottom: 0.25rem;">${c.name}</h4>
                                <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">${c.party}</p>
                                <div class="result-stat">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 700; font-size: 0.9rem;">
                                        <span>${c.votes || 0} Votes</span>
                                        <span style="color: var(--primary);">${percentage}%</span>
                                    </div>
                                    <div class="progress-bg" style="background: #f1f5f9; height: 10px; border-radius: 5px;">
                                        <div class="progress-bar" style="width: ${percentage}%; background: linear-gradient(to right, var(--primary), var(--accent)); height: 100%; border-radius: 5px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
};

const loadResults = async () => {
    try {
        const res = await fetch(`${API_URL}/voter/results`);
        const candidates = await res.json();
        renderResults(candidates);
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