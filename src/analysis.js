window.GTOAnalysis = {
    init: function() {
        const btn = document.getElementById('btn-clear-mistakes');
        if (btn) {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your mistake history?')) {
                    window.GTO.mistakes = {};
                    window.GTO.saveMistakes();
                    this.renderReport();
                }
            });
        }
    },

    renderReport: function() {
        const container = document.getElementById('analysis-report');
        if (!container) return;
        
        const mistakesObj = window.GTO.mistakes;
        if (!mistakesObj || Object.keys(mistakesObj).length === 0) {
            container.innerHTML = `<div class="placeholder-text">Play some hands in Trainer mode to generate your weakness report!</div>`;
            return;
        }

        const mistakesArr = Object.values(mistakesObj)
            .filter(m => m.mistakes > 0)
            .sort((a, b) => b.mistakes - a.mistakes);

        if (mistakesArr.length === 0) {
            container.innerHTML = `<div class="placeholder-text">You have no recorded mistakes! Great job!</div>`;
            return;
        }

        let html = `<div class="report-list">`;
        
        mistakesArr.slice(0, 5).forEach((m, i) => {
            const errRate = ((m.mistakes / m.tries) * 100).toFixed(1);
            let context = m.scenario.replace(/_/g, ' ');
            html += `
                <div class="report-item">
                    <div class="report-rank">#${i+1}</div>
                    <div class="report-hand">${m.hand}</div>
                    <div class="report-details">
                        <div class="report-scenario">${context}</div>
                        <div class="report-stats">
                            <span class="error-rate">${errRate}% Error Rate</span> 
                            <span class="error-count">(${m.mistakes} mistakes in ${m.tries} tries)</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
    }
};

document.addEventListener('DOMContentLoaded', () => { if (window.GTO) window.GTOAnalysis.init(); });
