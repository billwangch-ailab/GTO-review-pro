const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

let currentRanges = null;
let currentGameType = '6MAX';
let currentAction = 'RFI';
let currentPosition = 'BTN';

async function init() {
    generateMatrix();
    setupEventListeners();
    await loadData();
    updateUI();
}

function generateMatrix() {
    const container = document.getElementById('range-matrix');
    container.innerHTML = '';

    for (let r1 = 0; r1 < ranks.length; r1++) {
        for (let r2 = 0; r2 < ranks.length; r2++) {
            const cell = document.createElement('div');
            cell.className = 'hand-cell';
            
            let hand = '';
            if (r1 === r2) {
                hand = ranks[r1] + ranks[r2]; // pair
            } else if (r1 < r2) {
                hand = ranks[r1] + ranks[r2] + 's'; // suited
            } else {
                hand = ranks[r2] + ranks[r1] + 'o'; // offsuit
            }

            cell.dataset.hand = hand;
            
            const textSpan = document.createElement('span');
            textSpan.textContent = hand;
            cell.appendChild(textSpan);

            const fillDiv = document.createElement('div');
            fillDiv.className = 'fill';
            fillDiv.style.height = '0%';
            cell.appendChild(fillDiv);

            // Hover events
            cell.addEventListener('mouseenter', () => showDetails(hand));
            cell.addEventListener('mouseleave', () => hideDetails());

            container.appendChild(cell);
        }
    }
}

async function loadData() {
    try {
        if (!window.PREFLOP_RANGES) {
            throw new Error('PREFLOP_RANGES not defined. Make sure preflop_ranges.js is loaded.');
        }
        currentRanges = window.PREFLOP_RANGES;
    } catch (e) {
        console.error('Failed to load ranges, using fallback data', e);
        // Fallback minimal data
        currentRanges = {
            "6MAX": {
                "RFI": {
                    "BTN": { "AA": 100, "KK": 100, "AKs": 100, "AKo": 100 },
                    "UTG": { "AA": 100, "KK": 100, "AKs": 100 }
                }
            }
        };
    }
}

function setupEventListeners() {
    const gameTypeSelect = document.getElementById('game-type');
    gameTypeSelect.addEventListener('change', (e) => {
        currentGameType = e.target.value;
        const is9Max = currentGameType === '9MAX';
        
        // Toggle UI for 9-max seats
        const extraSeats = ['UTG1', 'UTG2', 'LJ'];
        extraSeats.forEach(pos => {
            const btn = document.querySelector(`.pos-btn[data-pos="${pos}"]`);
            const seat = document.querySelector(`.seat[data-pos="${pos}"]`);
            if (btn) btn.style.display = is9Max ? 'block' : 'none';
            if (seat) seat.style.display = is9Max ? 'flex' : 'none';
        });

        // Ensure current position is valid
        if (!is9Max && extraSeats.includes(currentPosition)) {
            currentPosition = 'UTG';
            document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.pos-btn[data-pos="UTG"]`).classList.add('active');
            document.querySelectorAll('.seat').forEach(s => s.classList.remove('active'));
            document.querySelector(`.seat[data-pos="UTG"]`).classList.add('active');
        }
        updateUI();
    });

    const actionSelect = document.getElementById('action-before');
    actionSelect.addEventListener('change', (e) => {
        currentAction = e.target.value;
        updateUI();
    });

    const posBtns = document.querySelectorAll('.pos-btn');
    posBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            posBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update table seats
            const pos = e.target.dataset.pos;
            currentPosition = pos;
            document.querySelectorAll('.seat').forEach(s => s.classList.remove('active'));
            const seat = document.querySelector(`.seat[data-pos="${pos}"]`);
            if (seat) seat.classList.add('active');

            updateUI();
        });
    });
}

function updateUI() {
    if (!currentRanges) return;
    
    const actionNames = { 'RFI': 'RFI', 'VS_OPEN': 'vs Open', 'VS_3BET': 'vs 3-Bet' };
    document.getElementById('current-range-title').textContent = `${currentPosition} ${actionNames[currentAction]} Range`;

    const rangeData = currentRanges[currentGameType]?.[currentAction]?.[currentPosition] || {};
    let totalHands = 0;
    let raiseHands = 0;

    // 13x13 grid has 169 cells, but weights: pairs=6, suited=4, offsuit=12
    let totalWeight = 0;
    let raiseWeight = 0;

    document.querySelectorAll('.hand-cell').forEach(cell => {
        const hand = cell.dataset.hand;
        const raisePct = rangeData[hand] || 0;
        
        const fill = cell.querySelector('.fill');
        fill.style.height = `${raisePct}%`;
        
        // Visual cue for mixed vs pure
        if (raisePct === 100) {
            fill.style.backgroundColor = 'var(--color-raise)';
        } else if (raisePct > 0) {
            fill.style.backgroundColor = 'var(--color-mixed)';
        } else {
            fill.style.backgroundColor = 'var(--color-fold)'; // though height is 0
        }

        // Calculate stats
        let weight = 12;
        if (hand.length === 2) weight = 6;
        else if (hand.endsWith('s')) weight = 4;

        totalWeight += weight;
        raiseWeight += weight * (raisePct / 100);
    });

    const overallFreq = (raiseWeight / totalWeight) * 100;
    document.getElementById('raise-freq').textContent = `${overallFreq.toFixed(1)}%`;
}

function showDetails(hand) {
    const details = document.getElementById('hover-details');
    details.classList.add('visible');
    
    const handTitle = document.querySelector('.hover-hand');
    handTitle.textContent = hand;

    const rangeData = currentRanges[currentGameType]?.[currentAction]?.[currentPosition] || {};
    const raisePct = rangeData[hand] || 0;
    const foldPct = 100 - raisePct;

    document.getElementById('hover-raise-fill').style.width = `${raisePct}%`;
    document.getElementById('hover-raise-pct').textContent = `${raisePct}%`;
    
    document.getElementById('hover-fold-fill').style.width = `${foldPct}%`;
    document.getElementById('hover-fold-pct').textContent = `${foldPct}%`;
}

function hideDetails() {
    // Optional: could keep last hand visible or fade out
    // document.getElementById('hover-details').classList.remove('visible');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
