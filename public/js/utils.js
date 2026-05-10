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
