window.GTOEditor = {
    isPainting: false,

    init: function() {
        this.generateEditMatrix();
        document.getElementById('btn-save-range')?.addEventListener('click', () => this.saveCustomRange());
        document.getElementById('btn-clear-range')?.addEventListener('click', () => this.clearEditor());
    },

    generateEditMatrix: function() {
        const container = document.getElementById('edit-matrix');
        if (!container) return;
        container.innerHTML = '';

        const ranks = window.GTO.ranks;
        for (let r1 = 0; r1 < ranks.length; r1++) {
            for (let r2 = 0; r2 < ranks.length; r2++) {
                const cell = document.createElement('div');
                cell.className = 'hand-cell';
                
                let hand = '';
                if (r1 === r2) hand = ranks[r1] + ranks[r2];
                else if (r1 < r2) hand = ranks[r1] + ranks[r2] + 's';
                else hand = ranks[r2] + ranks[r1] + 'o';

                cell.dataset.hand = hand;
                cell.dataset.val = '0';
                
                const textSpan = document.createElement('span');
                textSpan.textContent = hand;
                cell.appendChild(textSpan);

                const fillDiv = document.createElement('div');
                fillDiv.className = 'fill';
                fillDiv.style.height = '0%';
                cell.appendChild(fillDiv);

                cell.addEventListener('mousedown', (e) => {
                    this.isPainting = true;
                    this.paintCell(cell);
                });
                cell.addEventListener('mouseenter', (e) => {
                    if (this.isPainting) this.paintCell(cell);
                });

                container.appendChild(cell);
            }
        }

        document.addEventListener('mouseup', () => this.isPainting = false);
        document.addEventListener('mouseleave', () => this.isPainting = false);
    },

    paintCell: function(cell) {
        const editAction = document.getElementById('edit-action').value;
        cell.dataset.val = editAction;
        const fill = cell.querySelector('.fill');
        fill.style.height = `${editAction}%`;
        if (editAction === '100') fill.style.backgroundColor = 'var(--color-raise)';
        else if (editAction === '50') fill.style.backgroundColor = 'var(--color-mixed)';
        else fill.style.backgroundColor = 'var(--color-fold)';
    },

    loadRangeIntoEditor: function() {
        let rangeData = window.GTO.customRanges[window.GTO.currentGameType]?.[window.GTO.currentAction]?.[window.GTO.currentPosition];
        if (!rangeData) {
            rangeData = window.GTO.currentRanges[window.GTO.currentGameType]?.[window.GTO.currentAction]?.[window.GTO.currentPosition] || {};
        }

        document.querySelectorAll('#edit-matrix .hand-cell').forEach(cell => {
            const hand = cell.dataset.hand;
            const val = rangeData[hand] || 0;
            cell.dataset.val = val;
            
            const fill = cell.querySelector('.fill');
            fill.style.height = `${val}%`;
            if (val === 100) fill.style.backgroundColor = 'var(--color-raise)';
            else if (val > 0) fill.style.backgroundColor = 'var(--color-mixed)';
            else fill.style.backgroundColor = 'var(--color-fold)';
        });
    },

    saveCustomRange: function() {
        const rangeData = {};
        document.querySelectorAll('#edit-matrix .hand-cell').forEach(cell => {
            const val = parseInt(cell.dataset.val, 10);
            if (val > 0) {
                rangeData[cell.dataset.hand] = val;
            }
        });

        if (!window.GTO.customRanges[window.GTO.currentGameType]) window.GTO.customRanges[window.GTO.currentGameType] = {};
        if (!window.GTO.customRanges[window.GTO.currentGameType][window.GTO.currentAction]) window.GTO.customRanges[window.GTO.currentGameType][window.GTO.currentAction] = {};
        window.GTO.customRanges[window.GTO.currentGameType][window.GTO.currentAction][window.GTO.currentPosition] = rangeData;

        window.GTO.saveMistakes(); // We don't save mistakes here, we use localStorage directly for custom ranges
        localStorage.setItem('GTO_CUSTOM_RANGES', JSON.stringify(window.GTO.customRanges));
        alert('Custom range saved!');
        window.GTO.triggerUpdate();
    },

    clearEditor: function() {
        document.querySelectorAll('#edit-matrix .hand-cell').forEach(cell => {
            cell.dataset.val = '0';
            const fill = cell.querySelector('.fill');
            fill.style.height = '0%';
            fill.style.backgroundColor = 'var(--color-fold)';
        });
    }
};

document.addEventListener('DOMContentLoaded', () => { if (window.GTO) window.GTOEditor.init(); });
