const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

window.GTO = {
    ranks,
    currentRanges: null,
    currentGameType: '6MAX',
    currentAction: 'RFI',
    currentPosition: 'BTN',
    customRanges: {},
    mistakes: {},

    init: async function() {
        this.loadCustomRanges();
        this.loadMistakes();
        await this.loadData();
        
        if (window.GTOViewer) window.GTOViewer.init();
        if (window.GTOEditor) window.GTOEditor.init();
        
        this.setupNavigation();
        this.setupEventListeners();
        
        this.updateGameTypeUI();
        if (window.GTOViewer) window.GTOViewer.updateUI();
    },

    loadData: async function() {
        try {
            if (!window.PREFLOP_RANGES) throw new Error('No PREFLOP_RANGES');
            this.currentRanges = window.PREFLOP_RANGES;
            
            const cloneAndTighten = (baseObj, factor) => {
                const copy = JSON.parse(JSON.stringify(baseObj));
                for (let act in copy) {
                    for (let pos in copy[act]) {
                        for (let hand in copy[act][pos]) {
                            let v = copy[act][pos][hand];
                            if (v === 100 && factor < 0.9 && (hand.includes('o') || hand.includes('s'))) {
                                // Just a simple mock logic to tighten
                                copy[act][pos][hand] = Math.random() < factor ? 100 : 50;
                            } else if (v === 50) {
                                copy[act][pos][hand] = Math.random() < factor ? 50 : 0;
                            }
                        }
                    }
                }
                return copy;
            };

            if (!this.currentRanges['MTT_40BB'] && this.currentRanges['6MAX']) {
                this.currentRanges['MTT_40BB'] = cloneAndTighten(this.currentRanges['6MAX'], 0.8);
            }
            if (!this.currentRanges['MTT_20BB'] && this.currentRanges['6MAX']) {
                this.currentRanges['MTT_20BB'] = cloneAndTighten(this.currentRanges['6MAX'], 0.5);
            }
        } catch (e) {
            console.error('Failed to load ranges', e);
            this.currentRanges = { "6MAX": { "RFI": { "BTN": { "AA": 100 } } } };
        }
    },

    loadCustomRanges: function() {
        const saved = localStorage.getItem('GTO_CUSTOM_RANGES');
        if (saved) {
            try { this.customRanges = JSON.parse(saved); } 
            catch(e) { this.customRanges = {}; }
        }
    },

    loadMistakes: function() {
        const saved = localStorage.getItem('GTO_MISTAKES');
        if (saved) {
            try { this.mistakes = JSON.parse(saved); }
            catch(e) { this.mistakes = {}; }
        }
    },

    saveMistakes: function() {
        localStorage.setItem('GTO_MISTAKES', JSON.stringify(this.mistakes));
    },

    recordMistake: function(scenarioId, hand, isCorrect) {
        const key = `${scenarioId}_${hand}`;
        if (!this.mistakes[key]) {
            this.mistakes[key] = { tries: 0, mistakes: 0, hand: hand, scenario: scenarioId };
        }
        this.mistakes[key].tries++;
        if (!isCorrect) this.mistakes[key].mistakes++;
        this.saveMistakes();
    },

    getRangeData: function() {
        let r = this.customRanges[this.currentGameType]?.[this.currentAction]?.[this.currentPosition];
        if (!r) r = this.currentRanges[this.currentGameType]?.[this.currentAction]?.[this.currentPosition] || {};
        return r;
    },

    updateGameTypeUI: function() {
        const is9Max = this.currentGameType !== '6MAX';
        const table = document.querySelector('.poker-table');
        if (table) {
            table.classList.toggle('is-9max', is9Max);
            table.classList.toggle('is-6max', !is9Max);
        }
        
        const extraSeats = ['UTG1', 'UTG2', 'LJ'];
        extraSeats.forEach(pos => {
            const btn = document.querySelector(`.pos-btn[data-pos="${pos}"]`);
            const seat = document.querySelector(`.seat[data-pos="${pos}"]`);
            if (btn) btn.style.display = is9Max ? 'block' : 'none';
            if (seat) seat.style.display = is9Max ? 'flex' : 'none';
        });

        if (!is9Max && extraSeats.includes(this.currentPosition)) {
            this.currentPosition = 'UTG';
            document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.pos-btn[data-pos="UTG"]`).classList.add('active');
            document.querySelectorAll('.seat').forEach(s => s.classList.remove('active'));
            document.querySelector(`.seat[data-pos="UTG"]`).classList.add('active');
        }
    },

    setupEventListeners: function() {
        const gameTypeSelect = document.getElementById('game-type');
        gameTypeSelect?.addEventListener('change', (e) => {
            this.currentGameType = e.target.value;
            this.updateGameTypeUI();
            this.triggerUpdate();
        });

        const actionSelect = document.getElementById('action-before');
        actionSelect?.addEventListener('change', (e) => {
            this.currentAction = e.target.value;
            this.triggerUpdate();
        });

        const posBtns = document.querySelectorAll('.pos-btn');
        posBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                posBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPosition = e.target.dataset.pos;
                document.querySelectorAll('.seat').forEach(s => s.classList.remove('active'));
                const seat = document.querySelector(`.seat[data-pos="${this.currentPosition}"]`);
                if (seat) seat.classList.add('active');
                this.triggerUpdate();
            });
        });
    },

    triggerUpdate: function() {
        if (window.GTOViewer) window.GTOViewer.updateUI();
        if (window.GTOEditor && !document.getElementById('analysis-view').classList.contains('hidden')) {
            window.GTOEditor.loadRangeIntoEditor();
        }
    },

    setupNavigation: function() {
        const views = ['viewer', 'trainer', 'analysis', 'quiz'];
        const leftPanel = document.querySelector('.left-panel');

        views.forEach(v => {
            const btn = document.getElementById(`nav-${v}`);
            if (!btn) return;
            btn.addEventListener('click', () => {
                views.forEach(ov => {
                    document.getElementById(`nav-${ov}`)?.classList.remove('active');
                    document.getElementById(`${ov}-view`)?.classList.add('hidden');
                });
                
                btn.classList.add('active');
                document.getElementById(`${v}-view`)?.classList.remove('hidden');

                if (v === 'trainer' || v === 'quiz') {
                    leftPanel.style.opacity = '0.3';
                    leftPanel.style.pointerEvents = 'none';
                } else {
                    leftPanel.style.opacity = '1';
                    leftPanel.style.pointerEvents = 'auto';
                }

                if (v === 'trainer' && window.GTOTrainer) window.GTOTrainer.generateQuestion();
                if (v === 'quiz' && window.GTOQuiz) window.GTOQuiz.generateQuestion();
                if (v === 'analysis') {
                    if (window.GTOAnalysis) window.GTOAnalysis.renderReport();
                    if (window.GTOEditor) window.GTOEditor.loadRangeIntoEditor();
                }
            });
        });
    },

    renderCards: function(containerId, cardsArray) {
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
};

document.addEventListener('DOMContentLoaded', () => window.GTO.init());
