window.GTOTrainer = {
    timerInterval: null,
    timeLeft: 0,
    currentQuestion: null,
    score: 0,
    total: 0,
    streak: 0,

    init: function() {
        document.getElementById('btn-next')?.addEventListener('click', () => this.generateQuestion());
        document.getElementById('btn-bet')?.addEventListener('click', () => this.submitAnswer('bet'));
        document.getElementById('btn-check')?.addEventListener('click', () => this.submitAnswer('check'));
        document.getElementById('btn-raise')?.addEventListener('click', () => this.submitAnswer('raise'));
        document.getElementById('btn-call')?.addEventListener('click', () => this.submitAnswer('call'));
        document.getElementById('btn-fold')?.addEventListener('click', () => this.submitAnswer('fold'));
        
        document.getElementById('trainer-timer-setting')?.addEventListener('change', () => {
            const controls = document.querySelector('.trainer-controls');
            if (controls && !controls.classList.contains('hidden')) {
                this.startTimer();
            }
        });
    },

    startTimer: function() {
        clearInterval(this.timerInterval);
        const timerBar = document.getElementById('timer-bar');
        const timerSettingEl = document.getElementById('trainer-timer-setting');
        const durationTicks = timerSettingEl ? parseInt(timerSettingEl.value, 10) : 100;
        
        if (!timerBar) return;
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        timerBar.style.backgroundColor = 'var(--color-mixed)';

        if (durationTicks >= 999999) {
            timerBar.style.display = 'none'; // Hide timer for infinite
            return; // Don't start interval
        }
        timerBar.style.display = 'block';

        this.timeLeft = durationTicks;
        const totalTime = durationTicks;

        setTimeout(() => {
            timerBar.style.transition = 'width 0.1s linear, background-color 0.5s ease';
        }, 50);

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            const pct = (this.timeLeft / totalTime) * 100;
            timerBar.style.width = `${pct}%`;
            
            if (pct < 30) timerBar.style.backgroundColor = 'var(--color-raise)';
            else if (pct < 60) timerBar.style.backgroundColor = '#F59E0B';

            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.submitAnswer('timeout');
            }
        }, 100);
    },

    generateQuestion: function() {
        if (!window.GTO.currentRanges) return;
        
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
            this.currentQuestion = pf;
            
            document.getElementById('trainer-scenario').textContent = `POSTFLOP | ${pf.street}`;
            document.getElementById('trainer-hand-name').textContent = pf.scenario;

            window.GTO.renderCards('trainer-cards', [pf.hand]);
            window.GTO.renderCards('trainer-board', pf.board);
            document.getElementById('trainer-board').classList.remove('hidden');

            document.getElementById('btn-raise').classList.add('hidden');
            if (pf.facingBet === 0) {
                document.getElementById('btn-bet').classList.remove('hidden');
                document.getElementById('btn-check').classList.remove('hidden');
                document.getElementById('btn-call').classList.add('hidden');
            }

            this.startTimer();
            return;
        }

        const currentRanges = window.GTO.currentRanges;
        const customRanges = window.GTO.customRanges;
        const ranks = window.GTO.ranks;

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

        this.currentQuestion = {
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

        window.GTO.renderCards('trainer-cards', [hand[0]+s1, hand[1]+s2]);
        this.startTimer();
    },

    submitAnswer: function(userAction) {
        if (!this.currentQuestion) return;
        clearInterval(this.timerInterval);
        
        this.total++;
        let isCorrect = false;
        let correctStr = '';

        if (this.currentQuestion.type === 'postflop') {
            if (userAction === 'timeout') {
                correctStr = `Time's up! Correct action was ${this.currentQuestion.correctAction}.`;
            } else {
                isCorrect = (userAction === this.currentQuestion.correctAction);
                correctStr = this.currentQuestion.feedback;
            }
            window.GTO.recordMistake(`Postflop_${this.currentQuestion.street}`, this.currentQuestion.hand, isCorrect);
        } else {
            const raisePct = this.currentQuestion.raisePct;
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
            const scenarioId = `${this.currentQuestion.gameType}_${this.currentQuestion.position}_${this.currentQuestion.action}`;
            window.GTO.recordMistake(scenarioId, this.currentQuestion.hand, isCorrect);
        }

        if (isCorrect) {
            this.score++;
            this.streak++;
        } else {
            this.streak = 0;
        }

        document.getElementById('trainer-score').textContent = this.score;
        document.getElementById('trainer-total').textContent = this.total;
        
        const streakBoard = document.getElementById('streak-board');
        if (this.streak > 0) {
            streakBoard.classList.remove('hidden');
            document.getElementById('trainer-streak').textContent = this.streak;
        } else {
            streakBoard.classList.add('hidden');
        }

        document.querySelector('.trainer-controls').classList.add('hidden');
        const feedbackEl = document.getElementById('trainer-feedback');
        feedbackEl.classList.remove('hidden');
        
        if (isCorrect) {
            feedbackEl.className = 'trainer-feedback correct';
            document.getElementById('feedback-title').textContent = '✅ Correct!';
            document.getElementById('feedback-desc').textContent = this.currentQuestion.type === 'postflop' ? correctStr : `GTO strategy for ${this.currentQuestion.hand} is to ${correctStr}.`;
        } else {
            feedbackEl.className = 'trainer-feedback incorrect';
            document.getElementById('feedback-title').textContent = userAction === 'timeout' ? '⏰ Timeout!' : '❌ Incorrect!';
            document.getElementById('feedback-desc').textContent = this.currentQuestion.type === 'postflop' ? correctStr : `GTO strategy for ${this.currentQuestion.hand} is to ${correctStr}.`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { if (window.GTO) window.GTOTrainer.init(); });
