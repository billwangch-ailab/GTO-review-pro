const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

let currentRanges = null;
let currentGameType = '6MAX';
let currentAction = 'RFI';
let currentPosition = 'BTN';
let customRanges = {};

// Trainer Mode State
let trainerScore = 0;
let trainerTotal = 0;
let currentTrainerQuestion = null;
let currentStreak = 0;
let timerInterval = null;
let timeLeft = 0;

// Editor Mode State
let isPainting = false;

// Quiz Mode State
let quizScore = 0;
let quizTotal = 0;
let currentQuizQ = null;

async function init() {
    generateMatrix();
    generateEditMatrix();
    setupEventListeners();
    await loadData();
    loadCustomRanges();
    updateUI();
    
    const is9Max = currentGameType !== '6MAX';
    const table = document.querySelector('.poker-table');
    if (table) {
        table.classList.toggle('is-9max', is9Max);
        table.classList.toggle('is-6max', !is9Max);
    }
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

function generateEditMatrix() {
    const container = document.getElementById('edit-matrix');
    if (!container) return;
    container.innerHTML = '';

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
                isPainting = true;
                paintCell(cell);
            });
            cell.addEventListener('mouseenter', (e) => {
                if (isPainting) paintCell(cell);
            });

            container.appendChild(cell);
        }
    }

    document.addEventListener('mouseup', () => isPainting = false);
    document.addEventListener('mouseleave', () => isPainting = false);
}

function paintCell(cell) {
    const editAction = document.getElementById('edit-action').value;
    cell.dataset.val = editAction;
    const fill = cell.querySelector('.fill');
    fill.style.height = `${editAction}%`;
    if (editAction === '100') fill.style.backgroundColor = 'var(--color-raise)';
    else if (editAction === '50') fill.style.backgroundColor = 'var(--color-mixed)';
    else fill.style.backgroundColor = 'var(--color-fold)';
}

function loadCustomRanges() {
    const saved = localStorage.getItem('GTO_CUSTOM_RANGES');
    if (saved) {
        try {
            customRanges = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse custom ranges');
            customRanges = {};
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
        const is9Max = currentGameType !== '6MAX';
        
        const table = document.querySelector('.poker-table');
        if (table) {
            table.classList.toggle('is-9max', is9Max);
            table.classList.toggle('is-6max', !is9Max);
        }
        
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
        if (document.getElementById('analysis-view') && !document.getElementById('analysis-view').classList.contains('hidden')) {
            loadRangeIntoEditor();
        }
    });

    const actionSelect = document.getElementById('action-before');
    actionSelect.addEventListener('change', (e) => {
        currentAction = e.target.value;
        updateUI();
        if (document.getElementById('analysis-view') && !document.getElementById('analysis-view').classList.contains('hidden')) {
            loadRangeIntoEditor();
        }
    });

    const posBtns = document.querySelectorAll('.pos-btn');
    posBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            posBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const pos = e.target.dataset.pos;
            currentPosition = pos;
            document.querySelectorAll('.seat').forEach(s => s.classList.remove('active'));
            const seat = document.querySelector(`.seat[data-pos="${pos}"]`);
            if (seat) seat.classList.add('active');

            updateUI();
            if (document.getElementById('analysis-view') && !document.getElementById('analysis-view').classList.contains('hidden')) {
                loadRangeIntoEditor();
            }
        });
    });

    // Navigation Toggles
    const navViewer = document.getElementById('nav-viewer');
    const navTrainer = document.getElementById('nav-trainer');
    const navAnalysis = document.getElementById('nav-analysis');
    const navQuiz = document.getElementById('nav-quiz');
    const viewerView = document.getElementById('viewer-view');
    const trainerView = document.getElementById('trainer-view');
    const analysisView = document.getElementById('analysis-view');
    const quizView = document.getElementById('quiz-view');
    const leftPanel = document.querySelector('.left-panel');

    function resetNav() {
        if(navViewer) navViewer.classList.remove('active');
        if(navTrainer) navTrainer.classList.remove('active');
        if(navAnalysis) navAnalysis.classList.remove('active');
        if(navQuiz) navQuiz.classList.remove('active');
        
        if(viewerView) viewerView.classList.add('hidden');
        if(trainerView) trainerView.classList.add('hidden');
        if(analysisView) analysisView.classList.add('hidden');
        if(quizView) quizView.classList.add('hidden');
    }

    if (navViewer) {
        navViewer.addEventListener('click', () => {
            resetNav();
            navViewer.classList.add('active');
            viewerView.classList.remove('hidden');
            leftPanel.style.opacity = '1';
            leftPanel.style.pointerEvents = 'auto';
            updateUI();
        });
    }

    if (navTrainer) {
        navTrainer.addEventListener('click', () => {
            resetNav();
            navTrainer.classList.add('active');
            trainerView.classList.remove('hidden');
            leftPanel.style.opacity = '0.3';
            leftPanel.style.pointerEvents = 'none';
            generateTrainerQuestion();
        });
    }

    if (navAnalysis) {
        navAnalysis.addEventListener('click', () => {
            resetNav();
            navAnalysis.classList.add('active');
            analysisView.classList.remove('hidden');
            leftPanel.style.opacity = '1';
            leftPanel.style.pointerEvents = 'auto';
            loadRangeIntoEditor();
        });
    }

    if (navQuiz) {
        navQuiz.addEventListener('click', () => {
            resetNav();
            navQuiz.classList.add('active');
            quizView.classList.remove('hidden');
            leftPanel.style.opacity = '0.3';
            leftPanel.style.pointerEvents = 'none';
            generateQuizQuestion();
        });
    }

    // Editor Buttons
    document.getElementById('btn-save-range')?.addEventListener('click', saveCustomRange);
    document.getElementById('btn-clear-range')?.addEventListener('click', clearEditor);

    // Trainer Buttons
    document.getElementById('btn-bet')?.addEventListener('click', () => submitTrainerAnswer('bet'));
    document.getElementById('btn-check')?.addEventListener('click', () => submitTrainerAnswer('check'));
    document.getElementById('btn-raise')?.addEventListener('click', () => submitTrainerAnswer('raise'));
    document.getElementById('btn-call')?.addEventListener('click', () => submitTrainerAnswer('call'));
    document.getElementById('btn-fold')?.addEventListener('click', () => submitTrainerAnswer('fold'));
    document.getElementById('btn-next')?.addEventListener('click', generateTrainerQuestion);
}

function loadRangeIntoEditor() {
    let rangeData = customRanges[currentGameType]?.[currentAction]?.[currentPosition];
    if (!rangeData) {
        rangeData = currentRanges[currentGameType]?.[currentAction]?.[currentPosition] || {};
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
}

function saveCustomRange() {
    const rangeData = {};
    document.querySelectorAll('#edit-matrix .hand-cell').forEach(cell => {
        const val = parseInt(cell.dataset.val, 10);
        if (val > 0) {
            rangeData[cell.dataset.hand] = val;
        }
    });

    if (!customRanges[currentGameType]) customRanges[currentGameType] = {};
    if (!customRanges[currentGameType][currentAction]) customRanges[currentGameType][currentAction] = {};
    customRanges[currentGameType][currentAction][currentPosition] = rangeData;

    localStorage.setItem('GTO_CUSTOM_RANGES', JSON.stringify(customRanges));
    alert('Custom range saved!');
    updateUI();
}

function clearEditor() {
    document.querySelectorAll('#edit-matrix .hand-cell').forEach(cell => {
        cell.dataset.val = '0';
        const fill = cell.querySelector('.fill');
        fill.style.height = '0%';
        fill.style.backgroundColor = 'var(--color-fold)';
    });
}

function updateUI() {
    if (!currentRanges) return;
    
    const actionNames = { 'RFI': 'RFI', 'VS_OPEN': 'vs Open', 'VS_3BET': 'vs 3-Bet' };
    document.getElementById('current-range-title').textContent = `${currentPosition} ${actionNames[currentAction]} Range`;

    let rangeData = customRanges[currentGameType]?.[currentAction]?.[currentPosition];
    if (!rangeData) {
        rangeData = currentRanges[currentGameType]?.[currentAction]?.[currentPosition] || {};
    }
    let totalWeight = 0;
    let raiseWeight = 0;

    document.querySelectorAll('#range-matrix .hand-cell').forEach(cell => {
        const hand = cell.dataset.hand;
        const raisePct = rangeData[hand] || 0;
        
        const fill = cell.querySelector('.fill');
        fill.style.height = `${raisePct}%`;
        
        if (raisePct === 100) {
            fill.style.backgroundColor = 'var(--color-raise)';
        } else if (raisePct > 0) {
            fill.style.backgroundColor = 'var(--color-mixed)';
        } else {
            fill.style.backgroundColor = 'var(--color-fold)';
        }

        let weight = 12;
        if (hand.length === 2) weight = 6;
        else if (hand.endsWith('s')) weight = 4;

        totalWeight += weight;
        raiseWeight += weight * (raisePct / 100);
    });

    const overallFreq = totalWeight > 0 ? (raiseWeight / totalWeight) * 100 : 0;
    document.getElementById('raise-freq').textContent = `${overallFreq.toFixed(1)}%`;
}

function showDetails(hand) {
    const details = document.getElementById('hover-details');
    details.classList.add('visible');
    
    const handTitle = document.querySelector('.hover-hand');
    handTitle.textContent = hand;

    let rangeData = customRanges[currentGameType]?.[currentAction]?.[currentPosition];
    if (!rangeData) {
        rangeData = currentRanges[currentGameType]?.[currentAction]?.[currentPosition] || {};
    }
    const raisePct = rangeData[hand] || 0;
    const foldPct = 100 - raisePct;

    document.getElementById('hover-raise-fill').style.width = `${raisePct}%`;
    document.getElementById('hover-raise-pct').textContent = `${raisePct}%`;
    
    document.getElementById('hover-fold-fill').style.width = `${foldPct}%`;
    document.getElementById('hover-fold-pct').textContent = `${foldPct}%`;
}

function hideDetails() {
}

function renderCards(containerId, cardsArray) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const suitColors = {'♠': 'black', '♣': 'black', '♥': 'red', '♦': 'red'};
    
    cardsArray.forEach(cStr => {
        let cardsToRender = [];
        if (cStr.length === 4) {
            cardsToRender.push(cStr.substring(0,2));
            cardsToRender.push(cStr.substring(2,4));
        } else {
            cardsToRender.push(cStr);
        }

        cardsToRender.forEach(card => {
            const div = document.createElement('div');
            const suit = card[card.length - 1];
            div.className = `card ${suitColors[suit] || 'black'}`;
            div.textContent = card;
            container.appendChild(div);
        });
    });
}

function startTimer() {
    clearInterval(timerInterval);
    const timerBar = document.getElementById('timer-bar');
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = 'var(--color-mixed)';

    timeLeft = 100;
    setTimeout(() => {
        timerBar.style.transition = 'width 0.1s linear, background-color 0.5s ease';
    }, 50);

    timerInterval = setInterval(() => {
        timeLeft--;
        const pct = timeLeft;
        timerBar.style.width = `${pct}%`;
        
        if (pct < 30) {
            timerBar.style.backgroundColor = 'var(--color-raise)';
        } else if (pct < 60) {
            timerBar.style.backgroundColor = '#F59E0B';
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitTrainerAnswer('timeout');
        }
    }, 100);
}

function generateTrainerQuestion() {
    if (!currentRanges) return;
    
    document.getElementById('trainer-feedback').classList.add('hidden');
    document.querySelector('.trainer-controls').classList.remove('hidden');

    document.getElementById('btn-bet').classList.add('hidden');
    document.getElementById('btn-check').classList.add('hidden');
    document.getElementById('btn-raise').classList.remove('hidden');
    document.getElementById('btn-call').classList.remove('hidden');
    document.getElementById('btn-fold').classList.remove('hidden');
    document.getElementById('trainer-board').classList.add('hidden');

    if (window.POSTFLOP_SCENARIOS && Math.random() < 0.2) {
        const pf = window.POSTFLOP_SCENARIOS[Math.floor(Math.random() * window.POSTFLOP_SCENARIOS.length)];
        currentTrainerQuestion = pf;
        
        document.getElementById('trainer-scenario').textContent = `POSTFLOP | ${pf.street}`;
        document.getElementById('trainer-hand-name').textContent = pf.scenario;

        renderCards('trainer-cards', [pf.hand]);
        renderCards('trainer-board', pf.board);
        document.getElementById('trainer-board').classList.remove('hidden');

        document.getElementById('btn-raise').classList.add('hidden');
        if (pf.facingBet === 0) {
            document.getElementById('btn-bet').classList.remove('hidden');
            document.getElementById('btn-check').classList.remove('hidden');
            document.getElementById('btn-call').classList.add('hidden');
        }

        startTimer();
        return;
    }

    const gameTypes = Object.keys(currentRanges);
    const gType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    
    const actions = Object.keys(currentRanges[gType]);
    const act = actions[Math.floor(Math.random() * actions.length)];
    
    const positions = Object.keys(currentRanges[gType][act]);
    const pos = positions[Math.floor(Math.random() * positions.length)];

    let rangeData = customRanges[gType]?.[act]?.[pos];
    if (!rangeData) {
        rangeData = currentRanges[gType]?.[act]?.[pos] || {};
    }

    const pureRaises = [];
    const pureFolds = [];
    const mixedHands = [];

    for (let r1 = 0; r1 < ranks.length; r1++) {
        for (let r2 = 0; r2 < ranks.length; r2++) {
            let h = '';
            if (r1 === r2) h = ranks[r1] + ranks[r2];
            else if (r1 < r2) h = ranks[r1] + ranks[r2] + 's';
            else h = ranks[r2] + ranks[r1] + 'o';
            
            const pct = rangeData[h] || 0;
            if (pct === 100) pureRaises.push(h);
            else if (pct === 0) pureFolds.push(h);
            else mixedHands.push(h);
        }
    }

    let targetCategory = [];
    const rand = Math.random();
    
    if (rand < 0.6 && mixedHands.length > 0) targetCategory = mixedHands;
    else if (rand < 0.8 && pureRaises.length > 0) targetCategory = pureRaises;
    else if (pureFolds.length > 0) targetCategory = pureFolds;
    else targetCategory = [...pureRaises, ...pureFolds, ...mixedHands];

    const hand = targetCategory[Math.floor(Math.random() * targetCategory.length)];
    const raisePct = rangeData[hand] || 0;

    currentTrainerQuestion = {
        gameType: gType,
        action: act,
        position: pos,
        hand: hand,
        raisePct: raisePct,
        type: 'preflop'
    };

    const actionNames = { 'RFI': 'RFI', 'VS_OPEN': 'vs Open', 'VS_3BET': 'vs 3-Bet' };
    document.getElementById('trainer-scenario').textContent = `${gType} | ${pos} | ${actionNames[act]}`;
    document.getElementById('trainer-hand-name').textContent = hand;

    const suits = ['♠', '♥', '♦', '♣'];
    let s1 = suits[Math.floor(Math.random() * suits.length)];
    let s2 = suits[Math.floor(Math.random() * suits.length)];
    if (hand.endsWith('s')) s2 = s1;
    else if (hand.length === 3 || hand.length === 2) {
        while (s1 === s2) s2 = suits[Math.floor(Math.random() * suits.length)];
    }

    renderCards('trainer-cards', [hand[0]+s1, hand[1]+s2]);
    startTimer();
}

function submitTrainerAnswer(userAction) {
    if (!currentTrainerQuestion) return;
    clearInterval(timerInterval);
    
    trainerTotal++;
    let isCorrect = false;
    let correctStr = '';

    if (currentTrainerQuestion.type === 'postflop') {
        if (userAction === 'timeout') {
            correctStr = `Time's up! Correct action was ${currentTrainerQuestion.correctAction}.`;
        } else {
            isCorrect = (userAction === currentTrainerQuestion.correctAction);
            correctStr = currentTrainerQuestion.feedback;
        }
    } else {
        const raisePct = currentTrainerQuestion.raisePct;
        if (userAction === 'timeout') {
            correctStr = `Time's up! GTO strategy is to ${raisePct === 100 ? 'raise 100%' : (raisePct === 0 ? 'fold 100%' : `raise ${raisePct}%`)}`;
        } else {
            if (raisePct === 100) {
                if (userAction === 'raise') isCorrect = true;
                correctStr = 'raise 100% of the time';
            } else if (raisePct === 0) {
                if (userAction === 'fold') isCorrect = true;
                correctStr = 'fold 100% of the time';
            } else {
                isCorrect = true;
                correctStr = `mix it up! Raise ${raisePct}%, Fold ${100 - raisePct}%`;
            }
        }
    }

    if (isCorrect) {
        trainerScore++;
        currentStreak++;
    } else {
        currentStreak = 0;
    }

    document.getElementById('trainer-score').textContent = trainerScore;
    document.getElementById('trainer-total').textContent = trainerTotal;
    
    const streakBoard = document.getElementById('streak-board');
    if (currentStreak > 0) {
        streakBoard.classList.remove('hidden');
        document.getElementById('trainer-streak').textContent = currentStreak;
    } else {
        streakBoard.classList.add('hidden');
    }

    document.querySelector('.trainer-controls').classList.add('hidden');
    const feedbackEl = document.getElementById('trainer-feedback');
    feedbackEl.classList.remove('hidden');
    
    if (isCorrect) {
        feedbackEl.className = 'trainer-feedback correct';
        document.getElementById('feedback-title').textContent = '✅ Correct!';
        document.getElementById('feedback-desc').textContent = currentTrainerQuestion.type === 'postflop' ? correctStr : `GTO strategy for ${currentTrainerQuestion.hand} is to ${correctStr}.`;
    } else {
        feedbackEl.className = 'trainer-feedback incorrect';
        document.getElementById('feedback-title').textContent = userAction === 'timeout' ? '⏰ Timeout!' : '❌ Incorrect!';
        document.getElementById('feedback-desc').textContent = currentTrainerQuestion.type === 'postflop' ? correctStr : `GTO strategy for ${currentTrainerQuestion.hand} is to ${correctStr}.`;
    }
}

function generateQuizQuestion() {
    if (!window.QUIZ_QUESTIONS) return;
    document.getElementById('quiz-feedback').classList.add('hidden');
    
    const q = window.QUIZ_QUESTIONS[Math.floor(Math.random() * window.QUIZ_QUESTIONS.length)];
    currentQuizQ = q;

    document.getElementById('quiz-scenario').textContent = q.scenario;
    document.getElementById('quiz-question-text').textContent = q.question;
    
    renderCards('quiz-board', q.board);
    renderCards('quiz-hand', [q.hand]);

    const optsContainer = document.getElementById('quiz-options');
    optsContainer.innerHTML = '';
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-btn';
        btn.textContent = opt;
        btn.onclick = () => submitQuizAnswer(idx);
        optsContainer.appendChild(btn);
    });
}

function submitQuizAnswer(idx) {
    if (!currentQuizQ) return;
    quizTotal++;
    const isCorrect = (idx === currentQuizQ.correctIndex);
    
    if (isCorrect) quizScore++;
    
    document.getElementById('quiz-score').textContent = quizScore;
    document.getElementById('quiz-total').textContent = quizTotal;
    
    const fb = document.getElementById('quiz-feedback');
    fb.classList.remove('hidden');
    fb.className = 'trainer-feedback ' + (isCorrect ? 'correct' : 'incorrect');
    document.getElementById('quiz-feedback-title').textContent = isCorrect ? '✅ Correct!' : '❌ Incorrect!';
    document.getElementById('quiz-feedback-desc').textContent = currentQuizQ.feedback;
    
    document.getElementById('btn-quiz-next').onclick = generateQuizQuestion;
    
    document.querySelectorAll('.quiz-btn').forEach(b => b.disabled = true);
}

document.addEventListener('DOMContentLoaded', init);
