// Global UI Utilities
const ui = {
    showLoading: () => {
        document.getElementById('loading-overlay').style.display = 'flex';
    },
    hideLoading: () => {
        document.getElementById('loading-overlay').style.display = 'none';
    },
    showToast: (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="font-weight: 600;">${type === 'success' ? '✓' : '✕'}</div>
            <div>${message}</div>
        `;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },
    renderSkeleton: (containerId, type, count = 3) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let skeletonHtml = '';
        if (type === 'list') {
            skeletonHtml = Array(count).fill(`
                <div class="skeleton-card" style="height: 80px; margin-bottom: 10px; border-radius: 12px; padding: 1rem; background: white; border: 1px solid var(--border);">
                    <div class="skeleton skeleton-text" style="width: 60%; height: 1.2rem; margin-bottom: 15px;"></div>
                    <div class="skeleton skeleton-text" style="width: 90%; height: 0.8rem;"></div>
                </div>
            `).join('');
        } else if (type === 'card') {
            skeletonHtml = Array(count).fill(`
                <div class="skeleton-card" style="text-align: center; padding: 1.5rem; border-radius: 20px; background: white; border: 1px solid var(--border);">
                    <div class="skeleton skeleton-avatar" style="width: 80px; height: 80px; margin: 0 auto 1.5rem;"></div>
                    <div class="skeleton skeleton-title" style="margin: 0 auto 10px; width: 70%;"></div>
                    <div class="skeleton skeleton-text" style="width: 50%; margin: 0 auto;"></div>
                </div>
            `).join('');
        } else if (type === 'stats') {
            skeletonHtml = Array(count).fill(`
                <div class="skeleton-card" style="padding: 1.5rem; border-radius: 20px; background: white; border: 1px solid var(--border); text-align: center;">
                    <div class="skeleton skeleton-text" style="width: 40%; margin: 0 auto 10px;"></div>
                    <div class="skeleton skeleton-text" style="width: 60%; height: 2rem; margin: 0 auto;"></div>
                </div>
            `).join('');
        } else if (type === 'grid') {
            skeletonHtml = Array(count).fill(`
                <div class="skeleton-card" style="padding: 1.5rem; border-radius: 20px; background: white; border: 1px solid var(--border);">
                    <div class="skeleton skeleton-title" style="width: 40%;"></div>
                    <div class="skeleton skeleton-text" style="height: 100px; margin-bottom: 15px;"></div>
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                </div>
            `).join('');
        }
        container.innerHTML = `<div style="display: contents;">${skeletonHtml}</div>`;
    }
};

// Inject UI elements into every page
const injectUI = () => {
    if (document.getElementById('loading-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.style.display = 'none'; // Ensure hidden by default
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);

    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
};

// Run injection if body exists, otherwise wait
if (document.body) {
    injectUI();
} else {
    document.addEventListener('DOMContentLoaded', injectUI);
}
