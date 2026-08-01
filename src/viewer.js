window.GTOViewer = {
    init: function() {
        this.generateMatrix();
    },

    generateMatrix: function() {
        const container = document.getElementById('range-matrix');
        if (!container) return;
        container.innerHTML = '';

        const ranks = window.GTO.ranks;
        for (let r1 = 0; r1 < ranks.length; r1++) {
            for (let r2 = 0; r2 < ranks.length; r2++) {
                const cell = document.createElement('div');
                cell.className = 'hand-cell';
                
                let hand = '';
                if (r1 === r2) hand = ranks[r1] + ranks[r2]; // pair
                else if (r1 < r2) hand = ranks[r1] + ranks[r2] + 's'; // suited
                else hand = ranks[r2] + ranks[r1] + 'o'; // offsuit

                cell.dataset.hand = hand;
                
                const textSpan = document.createElement('span');
                textSpan.textContent = hand;
                cell.appendChild(textSpan);

                const fillDiv = document.createElement('div');
                fillDiv.className = 'fill';
                fillDiv.style.height = '0%';
                cell.appendChild(fillDiv);

                const pctSpan = document.createElement('span');
                pctSpan.className = 'cell-pct';
                pctSpan.textContent = '';
                pctSpan.style.display = 'none';
                cell.appendChild(pctSpan);

                cell.addEventListener('mouseenter', () => this.showDetails(hand));

                container.appendChild(cell);
            }
        }
    },

    calculateEv: function(hand, raisePct) {
        if (raisePct <= 0) return "0.00";
        const r1 = window.GTO.ranks.indexOf(hand[0]);
        const r2 = window.GTO.ranks.indexOf(hand[1]);
        const rankSum = r1 + r2;
        const posIndex = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'].indexOf(window.GTO.currentPosition);
        const posMultiplier = 1 + (Math.max(0, posIndex) * 0.1);
        const baseEv = Math.max(0.05, (20 - rankSum) * 0.12 * posMultiplier + (raisePct / 100) * 0.5);
        return baseEv.toFixed(2);
    },

    updateUI: function() {
        const actionNames = { 'RFI': 'RFI', 'VS_OPEN': 'vs Open', 'VS_3BET': 'vs 3-Bet' };
        const titleEl = document.getElementById('current-range-title');
        const subTitleEl = document.getElementById('range-subtitle');
        if (titleEl) titleEl.textContent = `${window.GTO.currentPosition} ${actionNames[window.GTO.currentAction]} Range`;
        
        if (subTitleEl) {
            if (window.GTO.currentGameType === 'MTT_20BB') subTitleEl.textContent = '20BB Effective (Tighter ranges)';
            else if (window.GTO.currentGameType === 'MTT_40BB') subTitleEl.textContent = '40BB Effective (Medium depth)';
            else subTitleEl.textContent = '100BB Effective, 2.5bb Open Size';
        }

        const rangeData = window.GTO.getRangeData();
        let totalWeight = 0;
        let raiseWeight = 0;

        document.querySelectorAll('#range-matrix .hand-cell').forEach(cell => {
            const hand = cell.dataset.hand;
            const raisePct = rangeData[hand] || 0;
            
            const fill = cell.querySelector('.fill');
            fill.style.height = `${raisePct}%`;
            
            if (raisePct === 100) fill.style.backgroundColor = 'var(--color-raise)';
            else if (raisePct > 0) fill.style.backgroundColor = 'var(--color-mixed)';
            else fill.style.backgroundColor = 'var(--color-fold)';
            
            const pctSpan = cell.querySelector('.cell-pct');
            if (pctSpan) {
                if (raisePct > 0) {
                    pctSpan.textContent = this.calculateEv(hand, raisePct);
                    pctSpan.style.display = 'block';
                } else {
                    pctSpan.style.display = 'none';
                }
            }

            let weight = 12;
            if (hand.length === 2) weight = 6;
            else if (hand.endsWith('s')) weight = 4;

            totalWeight += weight;
            raiseWeight += weight * (raisePct / 100);
        });

        const overallFreq = totalWeight > 0 ? (raiseWeight / totalWeight) * 100 : 0;
        const freqEl = document.getElementById('raise-freq');
        if (freqEl) freqEl.textContent = `${overallFreq.toFixed(1)}%`;
    },

    showDetails: function(hand) {
        const details = document.getElementById('hover-details');
        if (!details) return;
        details.classList.add('visible');
        
        const handTitle = document.querySelector('.hover-hand');
        if (handTitle) handTitle.textContent = hand;

        const rangeData = window.GTO.getRangeData();
        const raisePct = rangeData[hand] || 0;
        const foldPct = 100 - raisePct;

        let evStr = "0.00";
        const ranks = window.GTO.ranks;
        const r1 = ranks.indexOf(hand[0]);
        const r2 = ranks.indexOf(hand[1]);
        const rankSum = r1 + r2; // lower is better
        
        // Calculate Mock Raw Equity (Win Rate vs Random Hand)
        let rawEq;
        if (hand.length === 2) { // Pair
            rawEq = 85 - (r1 * 2.5);
        } else {
            rawEq = 68 - (r1 * 1.2) - (r2 * 1.5);
            if (hand.endsWith('s')) rawEq += 2.5;
            else rawEq -= 2.5;
        }
        rawEq = Math.max(30, Math.min(85, rawEq)); // clamp 30-85%
        
        evStr = this.calculateEv(hand, raisePct);
        
        const equityEl = document.getElementById('hover-equity');
        if (equityEl) {
            equityEl.textContent = `Win Rate: ~${rawEq.toFixed(1)}%`;
        }

        const evEl = document.getElementById('hover-ev');
        if (evEl) {
            evEl.textContent = `EV: +${evStr}`;
            evEl.style.color = evStr === "0.00" ? "var(--text-secondary)" : "#10B981";
        }

        const rFill = document.getElementById('hover-raise-fill');
        const rPct = document.getElementById('hover-raise-pct');
        if (rFill) rFill.style.width = `${raisePct}%`;
        if (rPct) rPct.textContent = `${raisePct}%`;
        
        const fFill = document.getElementById('hover-fold-fill');
        const fPct = document.getElementById('hover-fold-pct');
        if (fFill) fFill.style.width = `${foldPct}%`;
        if (fPct) fPct.textContent = `${foldPct}%`;
    }
};
