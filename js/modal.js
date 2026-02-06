class VisualModal {
    static init() {
        if (document.getElementById('visual-modal-overlay')) return;

        const html = `
            <div id="visual-modal-overlay" class="fixed inset-0 z-[9999] hidden items-center justify-center bg-slate-900/40 backdrop-blur-sm opacity-0 transition-opacity duration-300">
                <div id="visual-modal-card" class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform scale-95 opacity-0 transition-all duration-300 m-4">
                    <div class="text-center">
                        <div id="vm-icon-container" class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4 text-3xl">
                            <!-- Icon Injected Here -->
                        </div>
                        <h3 id="vm-title" class="text-lg font-black text-slate-800 leading-6"></h3>
                        <div class="mt-2">
                            <p id="vm-message" class="text-sm text-slate-500"></p>
                        </div>
                    </div>
                    <div id="vm-actions" class="mt-6 flex gap-3 justify-center">
                        <!-- Buttons Injected Here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    static show({ title, message, type = 'info', confirmText = 'Oke', cancelText = 'Batal', showCancel = false }) {
        this.init();

        return new Promise((resolve) => {
            const overlay = document.getElementById('visual-modal-overlay');
            const card = document.getElementById('visual-modal-card');
            const iconContainer = document.getElementById('vm-icon-container');
            const titleEl = document.getElementById('vm-title');
            const msgEl = document.getElementById('vm-message');
            const actionsEl = document.getElementById('vm-actions');

            // 1. Content
            titleEl.textContent = title || (type === 'error' ? 'Oops!' : 'Info');
            msgEl.textContent = message;

            // 2. Icon & Colors
            let icon = '';
            let iconBg = 'bg-slate-100';
            let iconColor = 'text-slate-500';
            let btnColor = 'bg-slate-700 hover:bg-slate-800';

            if (type === 'success') {
                icon = '<i class="fa-solid fa-check"></i>';
                iconBg = 'bg-emerald-100';
                iconColor = 'text-emerald-600';
                btnColor = 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30';
            } else if (type === 'error') {
                icon = '<i class="fa-solid fa-xmark"></i>';
                iconBg = 'bg-red-100';
                iconColor = 'text-red-500';
                btnColor = 'bg-red-500 hover:bg-red-600 shadow-red-500/30';
            } else if (type === 'warning' || type === 'confirm') {
                icon = '<i class="fa-solid fa-question"></i>';
                iconBg = 'bg-amber-100';
                iconColor = 'text-amber-500';
                btnColor = 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30';
            } else {
                icon = '<i class="fa-solid fa-info"></i>';
                btnColor = 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30';
                iconBg = 'bg-blue-100';
                iconColor = 'text-blue-500';
            }

            iconContainer.innerHTML = icon;
            iconContainer.className = `mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 text-3xl animate-bounce-short ${iconBg} ${iconColor}`;

            // 3. Buttons
            let buttonsHtml = '';
            if (showCancel) {
                buttonsHtml += `
                    <button id="vm-btn-cancel" class="flex-1 px-4 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        ${cancelText}
                    </button>
                `;
            }
            buttonsHtml += `
                <button id="vm-btn-confirm" class="flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all shadow-lg ${btnColor}">
                    ${confirmText}
                </button>
            `;
            actionsEl.innerHTML = buttonsHtml;

            // 4. Event Listeners
            const cleanup = () => {
                overlay.classList.add('opacity-0');
                card.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                }, 300);
            };

            const confirmBtn = document.getElementById('vm-btn-confirm');
            confirmBtn.onclick = () => {
                cleanup();
                resolve(true);
            };

            if (showCancel) {
                const cancelBtn = document.getElementById('vm-btn-cancel');
                cancelBtn.onclick = () => {
                    cleanup();
                    resolve(false);
                };
            }

            // 5. Show
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            // Slight delay to allow display:flex to apply before opacity transition
            setTimeout(() => {
                overlay.classList.remove('opacity-0');
                card.classList.remove('scale-95', 'opacity-0');
                card.classList.add('scale-100', 'opacity-100');
            }, 10);
        });
    }

    static async alert(message, title = 'Info', type = 'info') {
        const inferredType = title.toLowerCase() === 'error' || title.toLowerCase() === 'oops!' ? 'error' : type;
        return this.show({ title, message, type: inferredType });
    }

    static async confirm(message, title = 'Konfirmasi', type = 'confirm') {
        return this.show({ title, message, type, showCancel: true });
    }
}

// Attach to window globally
window.VisualModal = VisualModal;
