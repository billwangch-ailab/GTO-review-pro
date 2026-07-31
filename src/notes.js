window.GTONotes = {
    init: function() {
        const toggleBtn = document.getElementById('btn-toggle-notes');
        const notesPanel = document.getElementById('notes-panel');
        const notesArea = document.getElementById('notes-textarea');
        const closeBtn = document.getElementById('btn-close-notes');

        if (!toggleBtn || !notesPanel || !notesArea) return;

        // Load saved notes
        const savedNotes = localStorage.getItem('GTO_NOTES');
        if (savedNotes) {
            notesArea.value = savedNotes;
        }

        // Toggle panel
        toggleBtn.addEventListener('click', () => {
            notesPanel.classList.toggle('visible');
            if (notesPanel.classList.contains('visible')) {
                notesArea.focus();
            }
        });

        // Close panel
        closeBtn?.addEventListener('click', () => {
            notesPanel.classList.remove('visible');
        });

        // Auto-save on input
        let saveTimeout;
        notesArea.addEventListener('input', (e) => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                localStorage.setItem('GTO_NOTES', e.target.value);
            }, 500); // Save after 500ms of typing inactivity
        });
    }
};

document.addEventListener('DOMContentLoaded', () => { window.GTONotes.init(); });
