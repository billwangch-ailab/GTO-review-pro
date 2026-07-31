# GTO Review Pro 🃏

Welcome to **GTO Review Pro**, a modern, responsive, and modular Poker Training Web Application designed to help you study Preflop and Postflop GTO (Game Theory Optimal) strategies.

## 🚀 Features

- **📊 Range Viewer**: Interactive matrix displaying precise frequencies and EV (Expected Value) for Cash 6-Max, 9-Max, and MTT 20BB/40BB stack depths.
- **🏋️ Trainer Mode**: Test your intuition in both preflop and postflop scenarios. Configurable timers (10s, 30s, 60s, or Infinite) let you train for blitz reactions or deep thinking.
- **🧠 Mistake Analysis (Weakness Report)**: Every mistake you make in Trainer Mode is tracked. The Analysis dashboard automatically identifies your top 5 weakest hands and exact error rates.
- **✏️ Range Editor**: Build, save, and visualize your own custom preflop ranges.
- **📝 Study Scratchpad**: A floating notes panel available on every screen, allowing you to jot down insights, opponent reads, or mathematical reminders. All notes are saved automatically to your local browser storage.
- **🎯 Quiz Mode**: Test your knowledge of poker mathematics (Outs, Pot Odds, Rule of 4, Combinatorics).

## 🛠️ Tech Stack

This project uses vanilla web technologies to ensure maximum performance and minimal dependencies:
- **HTML5 & CSS3** (Vanilla, with modern Flexbox/Grid layouts and Custom Properties)
- **JavaScript (ES6+)** (Modular architecture)
- **LocalStorage** for saving custom ranges, mistake history, and personal notes.

## 📁 Architecture

The massive `main.js` was completely decoupled to ensure stability. The source code is organized into the following modules:

- `src/core.js`: Global state management and initialization.
- `src/viewer.js`: UI rendering for the interactive Range Matrix.
- `src/trainer.js`: Game loop logic and timer for Trainer Mode.
- `src/editor.js`: Logic for painting and saving custom ranges.
- `src/analysis.js`: Computation and rendering of the Weakness Report.
- `src/quiz.js`: Probability and math quiz handling.
- `src/notes.js`: Floating scratchpad functionality.

## 💻 How to Run

1. Clone or download this repository.
2. Open `index.html` in any modern web browser (Chrome, Safari, Edge). 
3. No build tools or servers are required for local usage!

## 📌 Upcoming Features (Roadmap)

- Multi-street Node Locking
- Range vs Range Equity Visualizations
- Real-time EV threshold tuning

---
*Built to help you master the math and crush the tables.*
