window.POSTFLOP_SCENARIOS = [
    {
        id: 'pf-1',
        type: 'postflop',
        street: 'Flop',
        scenario: 'You raised preflop from BTN. BB called. Flop comes dry.',
        board: ['A♠', '8♦', '3♣'],
        hand: 'A♥Q♥',
        pot: 5.5,
        facingBet: 0,
        correctAction: 'bet',
        feedback: 'Top Pair Good Kicker on a dry board. Betting a small sizing for value is standard.'
    },
    {
        id: 'pf-2',
        type: 'postflop',
        street: 'Turn',
        scenario: 'You C-bet the flop, BB check-raises. You call. Turn completes the flush.',
        board: ['8♠', '9♠', '2♦', 'J♠'],
        hand: 'A♣A♦',
        pot: 18.5,
        facingBet: 12.0,
        correctAction: 'fold',
        feedback: 'BB check-raised flop and is now betting big on a turn that completes the flush and straights. Overpair without a spade is a fold here.'
    },
    {
        id: 'pf-3',
        type: 'postflop',
        street: 'River',
        scenario: 'Action checked through on turn. River pairs the board.',
        board: ['Q♥', 'J♥', '4♣', '4♠', '4♦'],
        hand: 'A♠K♠',
        pot: 8.0,
        facingBet: 0,
        correctAction: 'check',
        feedback: 'Ace high has showdown value, but betting will only get called by better hands. Check to realize equity.'
    },
    {
        id: 'pf-4',
        type: 'postflop',
        street: 'Flop',
        scenario: '3-Bet pot. You are out of position. Board is very wet.',
        board: ['J♠', 'T♠', '7♦'],
        hand: 'A♠K♠',
        pot: 20.0,
        facingBet: 0,
        correctAction: 'bet',
        feedback: 'Nut flush draw + 2 overcards on a wet board. Betting as a semi-bluff is high EV to deny equity.'
    },
    {
        id: 'pf-5',
        type: 'postflop',
        street: 'Turn',
        scenario: 'You checked back Flop. Turn is a blank. Opponent bets 75% pot.',
        board: ['K♥', '5♣', '2♠', '7♦'],
        hand: 'Q♥J♥',
        pot: 12.0,
        facingBet: 9.0,
        correctAction: 'fold',
        feedback: 'You only have Queen high with no direct draws against a large turn bet. Fold.'
    }
];

window.QUIZ_QUESTIONS = [
    {
        id: 'q-1',
        type: 'outs',
        scenario: 'Nut Flush Draw on Flop',
        board: ['2♠', '8♠', 'K♦'],
        hand: 'A♠Q♠',
        question: 'How many outs do you have to hit a flush?',
        options: ['8 outs', '9 outs', '12 outs', '15 outs'],
        correctIndex: 1,
        feedback: 'There are 13 spades in the deck. You hold 2, and 2 are on the board. 13 - 4 = 9 outs.'
    },
    {
        id: 'q-2',
        type: 'pot_odds',
        scenario: 'Facing a half-pot bet on the River',
        board: ['2♥', '7♣', '9♦', 'K♠', 'A♥'],
        hand: '8♥8♠',
        question: 'Pot is $100. Opponent bets $50. How much equity do you need to make a break-even call?',
        options: ['25%', '33.3%', '50%', '15%'],
        correctIndex: 0,
        feedback: 'You are calling $50 to win a total pot of $200 ($100 + $50 bet + $50 your call). 50 / 200 = 0.25 (25%).'
    },
    {
        id: 'q-3',
        type: 'rule24',
        scenario: 'Open Ended Straight Draw (OESD)',
        board: ['5♣', '6♥', 'K♦'],
        hand: '7♠8♠',
        question: 'You have 8 outs on the Flop. By the Rule of 4, what is your approximate chance of hitting the straight by the River?',
        options: ['16%', '24%', '32%', '40%'],
        correctIndex: 2,
        feedback: 'Rule of 4: On the flop, multiply your outs by 4 to get the rough percentage of hitting by the river. 8 outs × 4 = ~32%.'
    },
    {
        id: 'q-4',
        type: 'combo',
        scenario: 'Preflop Combos',
        board: [],
        hand: 'A♠K♠',
        question: 'How many total combos of AK (suited + offsuit) exist before any cards are dealt?',
        options: ['8 combos', '12 combos', '16 combos', '24 combos'],
        correctIndex: 2,
        feedback: '4 suited combos + 12 offsuit combos = 16 total combos of AK.'
    },
    {
        id: 'q-5',
        type: 'equity',
        scenario: 'All in Preflop',
        board: [],
        hand: 'A♠A♥',
        question: 'What is the approximate equity of AA vs an unknown random hand?',
        options: ['65%', '75%', '85%', '95%'],
        correctIndex: 2,
        feedback: 'AA has about 85% equity preflop against any two random cards.'
    },
    {
        id: 'q-6',
        type: 'outs',
        scenario: 'Combo Draw',
        board: ['9♠', '8♠', '2♦'],
        hand: 'J♠T♠',
        question: 'How many outs do you have with an OESD + Flush draw (assuming no interference)?',
        options: ['15 outs', '12 outs', '17 outs', '21 outs'],
        correctIndex: 0,
        feedback: '9 flush outs + 8 straight outs = 17, but 2 of the straight outs are also spades. So 17 - 2 = 15 unique outs.'
    }
];
