const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

let currentRanges = null;
let currentGameType = '6MAX';
let currentAction = 'RFI';
let currentPosition = 'BTN';

// Trainer Mode State
let trainerScore = 0;
let trainerTotal = 0;
let currentTrainerQuestion = null;

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

    // Navigation Toggles
    const navViewer = document.getElementById('nav-viewer');
    const navTrainer = document.getElementById('nav-trainer');
    const viewerView = document.getElementById('viewer-view');
    const trainerView = document.getElementById('trainer-view');
    const leftPanel = document.querySelector('.left-panel');

    if (navViewer && navTrainer) {
        navViewer.addEventListener('click', () => {
            navViewer.classList.add('active');
            navTrainer.classList.remove('active');
            viewerView.classList.remove('hidden');
            trainerView.classList.add('hidden');
            leftPanel.style.opacity = '1';
            leftPanel.style.pointerEvents = 'auto';
        });

        navTrainer.addEventListener('click', () => {
            navTrainer.classList.add('active');
            navViewer.classList.remove('active');
            trainerView.classList.remove('hidden');
            viewerView.classList.add('hidden');
            leftPanel.style.opacity = '0.3';
            leftPanel.style.pointerEvents = 'none';
            generateTrainerQuestion();
        });
    }

    // Trainer Buttons
    document.getElementById('btn-raise')?.addEventListener('click', () => submitTrainerAnswer('raise'));
    document.getElementById('btn-call')?.addEventListener('click', () => submitTrainerAnswer('call'));
    document.getElementById('btn-fold')?.addEventListener('click', () => submitTrainerAnswer('fold'));
    document.getElementById('btn-next')?.addEventListener('click', generateTrainerQuestion);
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

/* =========================================
   Trainer Mode Logic
   ========================================= */

function generateTrainerQuestion() {
    if (!currentRanges) return;
    
    // Hide feedback, show controls
    document.getElementById('trainer-feedback').classList.add('hidden');
    document.querySelector('.trainer-controls').classList.remove('hidden');

    // 1. Pick a random scenario
    const gameTypes = Object.keys(currentRanges);
    const gType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    
    const actions = Object.keys(currentRanges[gType]);
    const act = actions[Math.floor(Math.random() * actions.length)];
    
    const positions = Object.keys(currentRanges[gType][act]);
    const pos = positions[Math.floor(Math.random() * positions.length)];

    // 2. Pick a random hand
    // Generate all 169 possible hands
    const allHands = [];
    for (let r1 = 0; r1 < ranks.length; r1++) {
        for (let r2 = 0; r2 < ranks.length; r2++) {
            if (r1 === r2) allHands.push(ranks[r1] + ranks[r2]);
            else if (r1 < r2) allHands.push(ranks[r1] + ranks[r2] + 's');
            else allHands.push(ranks[r2] + ranks[r1] + 'o');
        }
    }
    const hand = allHands[Math.floor(Math.random() * allHands.length)];
    
    // 3. Get the correct raise percentage
    const raisePct = currentRanges[gType][act][pos][hand] || 0;

    currentTrainerQuestion = {
        gameType: gType,
        action: act,
        position: pos,
        hand: hand,
        raisePct: raisePct
    };

    // 4. Update UI
    const actionNames = { 'RFI': 'RFI', 'VS_OPEN': 'vs Open', 'VS_3BET': 'vs 3-Bet' };
    document.getElementById('trainer-scenario').textContent = `${gType} | ${pos} | ${actionNames[act]}`;
    document.getElementById('trainer-hand-name').textContent = hand;

    // Generate random suits for the visual cards
    const suits = ['♠', '♥', '♦', '♣'];
    const suitColors = {'♠': 'black', '♣': 'black', '♥': 'red', '♦': 'red'};
    
    let s1 = suits[Math.floor(Math.random() * suits.length)];
    let s2 = suits[Math.floor(Math.random() * suits.length)];
    
    if (hand.endsWith('s')) {
        s2 = s1; // Suited
    } else if (hand.length === 3 || hand.length === 2) { // Offsuit or Pair
        while (s1 === s2) {
            s2 = suits[Math.floor(Math.random() * suits.length)];
        }
    }

    const card1 = document.getElementById('card-1');
    const card2 = document.getElementById('card-2');
    
    card1.textContent = hand[0] + s1;
    card1.className = `card ${suitColors[s1]}`;
    
    card2.textContent = hand[1] + s2;
    card2.className = `card ${suitColors[s2]}`;
}

function submitTrainerAnswer(userAction) {
    if (!currentTrainerQuestion) return;
    
    trainerTotal++;
    
    const raisePct = currentTrainerQuestion.raisePct;
    let isCorrect = false;
    let correctStr = '';

    if (raisePct === 100) {
        if (userAction === 'raise') isCorrect = true;
        correctStr = 'raise 100% of the time';
    } else if (raisePct === 0) {
        if (userAction === 'fold') isCorrect = true;
        correctStr = 'fold 100% of the time';
    } else {
        // Mixed strategy
        isCorrect = true; // Technically any action in the mixed frequency is fine, but we can refine this
        correctStr = `mix it up! Raise ${raisePct}%, Fold ${100 - raisePct}%`;
    }

    if (isCorrect) trainerScore++;

    // Update Score UI
    document.getElementById('trainer-score').textContent = trainerScore;
    document.getElementById('trainer-total').textContent = trainerTotal;

    // Show Feedback
    document.querySelector('.trainer-controls').classList.add('hidden');
    const feedbackEl = document.getElementById('trainer-feedback');
    feedbackEl.classList.remove('hidden');
    
    if (isCorrect) {
        feedbackEl.className = 'trainer-feedback correct';
        document.getElementById('feedback-title').textContent = '✅ Correct!';
    } else {
        feedbackEl.className = 'trainer-feedback incorrect';
        document.getElementById('feedback-title').textContent = '❌ Incorrect!';
    }
    
    document.getElementById('feedback-desc').textContent = `GTO strategy for ${currentTrainerQuestion.hand} is to ${correctStr}.`;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
