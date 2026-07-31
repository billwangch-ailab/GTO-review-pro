window.GTOQuiz = {
    score: 0,
    total: 0,
    currentQuestion: null,

    init: function() {
        document.getElementById('btn-quiz-next')?.addEventListener('click', () => this.generateQuestion());
    },

    generateQuestion: function() {
        if (!window.QUIZ_QUESTIONS) return;
        document.getElementById('quiz-feedback').classList.add('hidden');
        
        const q = window.QUIZ_QUESTIONS[Math.floor(Math.random() * window.QUIZ_QUESTIONS.length)];
        this.currentQuestion = q;

        document.getElementById('quiz-scenario').textContent = q.scenario;
        document.getElementById('quiz-question-text').textContent = q.question;
        
        window.GTO.renderCards('quiz-board', q.board);
        window.GTO.renderCards('quiz-hand', [q.hand]);

        const optsContainer = document.getElementById('quiz-options');
        optsContainer.innerHTML = '';
        
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-btn';
            btn.textContent = opt;
            btn.onclick = () => this.submitAnswer(idx);
            optsContainer.appendChild(btn);
        });
    },

    submitAnswer: function(idx) {
        if (!this.currentQuestion) return;
        this.total++;
        const isCorrect = (idx === this.currentQuestion.correctIndex);
        
        if (isCorrect) this.score++;
        
        document.getElementById('quiz-score').textContent = this.score;
        document.getElementById('quiz-total').textContent = this.total;
        
        const fb = document.getElementById('quiz-feedback');
        fb.classList.remove('hidden');
        fb.className = 'trainer-feedback ' + (isCorrect ? 'correct' : 'incorrect');
        document.getElementById('quiz-feedback-title').textContent = isCorrect ? '✅ Correct!' : '❌ Incorrect!';
        document.getElementById('quiz-feedback-desc').textContent = this.currentQuestion.feedback;
        
        document.querySelectorAll('.quiz-btn').forEach(b => b.disabled = true);
    }
};

document.addEventListener('DOMContentLoaded', () => { if (window.GTO) window.GTOQuiz.init(); });
