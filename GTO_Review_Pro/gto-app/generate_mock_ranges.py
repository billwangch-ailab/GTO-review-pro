import json

ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
positions_6max = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']
positions_9max = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']
actions = ['RFI', 'VS_OPEN', 'VS_3BET']
game_types = ['6MAX', '9MAX']

def hand_rank(r):
    return 14 - ranks.index(r)

def generate_range(pos_index, total_pos, action):
    pos_name = pos_list[pos_index]
    # tightness 1.0 = UTG, 0.0 = BTN. Blinds are handled specially.
    if pos_name == 'BB' and action == 'RFI':
        return {} # BB gets a walk if folded to, no RFI range needed
    
    if pos_name in ['SB', 'BB']:
        tightness = 0.2 # SB RFI is wide (similar to BTN), BB defend is wide
    else:
        btn_index = pos_list.index('BTN')
        tightness = 1.0 - (pos_index / btn_index) if btn_index > 0 else 0.5
        
    range_dict = {}
    for r1 in ranks:
        for r2 in ranks:
            v1 = hand_rank(r1)
            v2 = hand_rank(r2)
            
            if r1 == r2: # pair
                hand = r1 + r2
                if action == 'RFI':
                    if v1 >= 5 + (tightness * 4): val = 100
                    else: val = 0
                elif action == 'VS_OPEN':
                    if v1 >= 8 + (tightness * 3): val = 100
                    elif v1 >= 5: val = 50
                    else: val = 0
                else: # VS_3BET
                    if v1 >= 11 + (tightness * 2): val = 100
                    elif v1 >= 9: val = 50
                    else: val = 0
            elif ranks.index(r1) < ranks.index(r2): # suited
                hand = r1 + r2 + 's'
                gap = v1 - v2
                if action == 'RFI':
                    if v1 >= 10 and gap <= 4 + (1-tightness)*5: val = 100
                    elif gap <= 1 and v2 >= 5: val = 100 if tightness < 0.5 else 0
                    elif r1 == 'A' and v2 >= 2 + tightness*5: val = 100
                    else: val = 0
                elif action == 'VS_OPEN':
                    if v1 >= 12 and gap <= 2: val = 100
                    elif r1 == 'A' and v2 >= 10: val = 50
                    elif gap == 1 and 6 <= v2 <= 10 and tightness < 0.7: val = 50
                    else: val = 0
                else: # VS_3BET
                    if v1 >= 13 and gap <= 1: val = 100
                    else: val = 0
            else: # offsuit
                hand = r2 + r1 + 'o'
                v1_o, v2_o = v2, v1 # swap back to high-low
                gap = v1_o - v2_o
                if action == 'RFI':
                    if v1_o >= 11 and gap <= 2 + (1-tightness)*3: val = 100
                    elif r2 == 'A' and v2_o >= 9 + tightness*3: val = 100
                    else: val = 0
                elif action == 'VS_OPEN':
                    if v1_o >= 13 and gap <= 1: val = 100
                    else: val = 0
                else: # VS_3BET
                    if v1_o == 14 and v2_o == 13: val = 50 # AKo
                    else: val = 0
                    
            if val > 0:
                range_dict[hand] = val
                
    return range_dict

data = {}
for gt in game_types:
    data[gt] = {}
    pos_list = positions_6max if gt == '6MAX' else positions_9max
    for action in actions:
        data[gt][action] = {}
        for i, pos in enumerate(pos_list):
            data[gt][action][pos] = generate_range(i, len(pos_list), action)

with open('data/preflop_ranges.js', 'w') as f:
    f.write('window.PREFLOP_RANGES = ' + json.dumps(data) + ';')

print("Generated mock data successfully as JS.")
