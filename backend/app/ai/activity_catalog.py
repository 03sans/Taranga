"""
Activity catalog — 20 LD-specific intervention activities (4 per LD domain).
Each activity maps to one of 3 game engines: MatchPairs, FallingCatcher, MultipleChoice.

game_config shapes:
  MatchPairs:     {"pairs": [{"left":..,"right":..},...], "time_limit": int}
  FallingCatcher: {"target_label":str, "items":[{"label":str,"correct":bool},...], "lives":int}
  MultipleChoice: {"questions":[{"stem":str,"options":[str],"answer_index":int,"feedback":str},...], "time_limit":int}
"""

ACTIVITIES = [

    # ═══════════════════════════════════════════════════════════
    # DYSLEXIA
    # ═══════════════════════════════════════════════════════════
    {
        "key": "dys_letter_flip",
        "ld_type": "dyslexia",
        "title": "Letter Flip",
        "description": "Catch only the CORRECTLY written letters before they hit the bottom. Don't catch mirror images!",
        "icon": "🔤",
        "xp": 60,
        "difficulty": "easy",
        "engine": "FallingCatcher",
        "game_config": {
            "target_label": "Catch correctly-written letters only!",
            "lives": 3,
            "items": [
                {"label": "b", "correct": True},
                {"label": "d", "correct": False},
                {"label": "p", "correct": True},
                {"label": "q", "correct": False},
                {"label": "n", "correct": True},
                {"label": "u", "correct": False},
                {"label": "m", "correct": True},
                {"label": "w", "correct": False},
                {"label": "b", "correct": True},
                {"label": "d", "correct": False},
                {"label": "p", "correct": True},
                {"label": "q", "correct": False},
            ],
        },
    },
    {
        "key": "dys_rhyme_rocket",
        "ld_type": "dyslexia",
        "title": "Rhyme Rocket",
        "description": "Match each word to the word it rhymes with. Blast off when all pairs are matched!",
        "icon": "🚀",
        "xp": 50,
        "difficulty": "easy",
        "engine": "MatchPairs",
        "game_config": {
            "time_limit": 60,
            "pairs": [
                {"left": "cat", "right": "hat"},
                {"left": "tree", "right": "bee"},
                {"left": "fish", "right": "dish"},
                {"left": "cake", "right": "lake"},
                {"left": "ball", "right": "fall"},
                {"left": "sun", "right": "run"},
            ],
        },
    },
    {
        "key": "dys_word_builder",
        "ld_type": "dyslexia",
        "title": "Word Builder",
        "description": "Listen to the word and pick the correct spelling from the options.",
        "icon": "🏗️",
        "xp": 70,
        "difficulty": "medium",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 120,
            "questions": [
                {"stem": "Which spelling is correct?", "options": ["freind", "friend", "frind", "friand"], "answer_index": 1, "feedback": "'friend' — i before e except after c!"},
                {"stem": "Which spelling is correct?", "options": ["becuase", "becasue", "because", "becouse"], "answer_index": 2, "feedback": "'because' — be-CAUSE"},
                {"stem": "Which spelling is correct?", "options": ["recieve", "receive", "receve", "recieve"], "answer_index": 1, "feedback": "'receive' — except after C, it's E before I"},
                {"stem": "Which spelling is correct?", "options": ["seperate", "separete", "separate", "seperete"], "answer_index": 2, "feedback": "'separate' — think of 'a rat' in the middle!"},
                {"stem": "Which spelling is correct?", "options": ["beleive", "believe", "belive", "beleeve"], "answer_index": 1, "feedback": "'believe' — never BELIEvE a LIE!"},
                {"stem": "Which spelling is correct?", "options": ["definately", "definitly", "definitely", "definetly"], "answer_index": 2, "feedback": "'definitely' — FINITE is in the middle!"},
            ],
        },
    },
    {
        "key": "dys_spot_error",
        "ld_type": "dyslexia",
        "title": "Spot the Error",
        "description": "Find the misspelled word hidden in each sentence. Train your eye for spelling!",
        "icon": "🔍",
        "xp": 80,
        "difficulty": "hard",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 150,
            "questions": [
                {"stem": "Spot the misspelled word: 'The libary was full of interesting books.'", "options": ["The", "libary", "interesting", "books"], "answer_index": 1, "feedback": "It's 'library' — with an R!"},
                {"stem": "Spot the misspelled word: 'She recieved a letter from her friend.'", "options": ["recieved", "letter", "friend", "She"], "answer_index": 0, "feedback": "It's 'received' — ei not ie after c"},
                {"stem": "Spot the misspelled word: 'He was absolutly sure about the answer.'", "options": ["was", "absolutly", "sure", "answer"], "answer_index": 1, "feedback": "It's 'absolutely' — don't forget the e!"},
                {"stem": "Spot the misspelled word: 'The wether today was cold and rainy.'", "options": ["wether", "today", "cold", "rainy"], "answer_index": 0, "feedback": "It's 'weather' — ea for the air!"},
                {"stem": "Spot the misspelled word: 'The commitee voted on the new rules.'", "options": ["The", "commitee", "voted", "rules"], "answer_index": 1, "feedback": "It's 'committee' — two m's, two t's, two e's"},
            ],
        },
    },

    # ═══════════════════════════════════════════════════════════
    # DYSCALCULIA
    # ═══════════════════════════════════════════════════════════
    {
        "key": "dc_number_jump",
        "ld_type": "dyscalculia",
        "title": "Number Jump",
        "description": "Numbers are falling! Catch only the ones that fit the counting pattern. Skip by 2s!",
        "icon": "🦘",
        "xp": 60,
        "difficulty": "easy",
        "engine": "FallingCatcher",
        "game_config": {
            "target_label": "Catch numbers that count by 2: 2, 4, 6, 8...",
            "lives": 3,
            "items": [
                {"label": "2", "correct": True},
                {"label": "3", "correct": False},
                {"label": "4", "correct": True},
                {"label": "5", "correct": False},
                {"label": "6", "correct": True},
                {"label": "7", "correct": False},
                {"label": "8", "correct": True},
                {"label": "9", "correct": False},
                {"label": "10", "correct": True},
                {"label": "11", "correct": False},
                {"label": "12", "correct": True},
                {"label": "13", "correct": False},
            ],
        },
    },
    {
        "key": "dc_math_match",
        "ld_type": "dyscalculia",
        "title": "Math Match",
        "description": "Match each maths expression to its correct answer. Be fast — the timer is ticking!",
        "icon": "🧮",
        "xp": 55,
        "difficulty": "easy",
        "engine": "MatchPairs",
        "game_config": {
            "time_limit": 90,
            "pairs": [
                {"left": "3 + 4", "right": "7"},
                {"left": "10 − 6", "right": "4"},
                {"left": "5 × 3", "right": "15"},
                {"left": "12 ÷ 4", "right": "3"},
                {"left": "8 + 9", "right": "17"},
                {"left": "20 − 7", "right": "13"},
            ],
        },
    },
    {
        "key": "dc_clock_hero",
        "ld_type": "dyscalculia",
        "title": "Clock Hero",
        "description": "Read the clock description and choose the correct time. Master telling time!",
        "icon": "⏰",
        "xp": 65,
        "difficulty": "medium",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 120,
            "questions": [
                {"stem": "The hour hand points to 3 and the minute hand points to 12. What time is it?", "options": ["12:03", "3:00", "3:12", "12:15"], "answer_index": 1, "feedback": "3:00 — when the minute hand is at 12, it's o'clock!"},
                {"stem": "The hour hand is between 4 and 5. The minute hand points to 6. What time is it?", "options": ["4:30", "6:04", "4:06", "5:30"], "answer_index": 0, "feedback": "4:30 — the minute hand at 6 means 30 minutes past!"},
                {"stem": "It's quarter past 7. What time is it?", "options": ["7:25", "7:15", "7:13", "7:45"], "answer_index": 1, "feedback": "7:15 — a quarter of an hour is 15 minutes"},
                {"stem": "It's half past 2. What time is it?", "options": ["2:50", "12:02", "2:30", "3:00"], "answer_index": 2, "feedback": "2:30 — half past means 30 minutes past the hour!"},
                {"stem": "The hour hand is between 11 and 12. The minute hand points to 3. What time is it?", "options": ["11:15", "3:11", "12:03", "11:45"], "answer_index": 0, "feedback": "11:15 — minute hand at 3 = 15 minutes past!"},
            ],
        },
    },
    {
        "key": "dc_pattern_find",
        "ld_type": "dyscalculia",
        "title": "Pattern Detective",
        "description": "Find the missing number in the pattern. Become a number pattern expert!",
        "icon": "🔮",
        "xp": 75,
        "difficulty": "hard",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 120,
            "questions": [
                {"stem": "What comes next? 5, 10, 15, 20, __", "options": ["22", "25", "24", "26"], "answer_index": 1, "feedback": "25! Counting by 5s each time."},
                {"stem": "What comes next? 2, 4, 8, 16, __", "options": ["18", "20", "32", "24"], "answer_index": 2, "feedback": "32! Each number doubles."},
                {"stem": "What is missing? 3, 6, __, 12, 15", "options": ["8", "9", "10", "11"], "answer_index": 1, "feedback": "9! Counting up by 3s."},
                {"stem": "What comes next? 100, 90, 80, 70, __", "options": ["65", "55", "60", "50"], "answer_index": 2, "feedback": "60! Counting down by 10s."},
                {"stem": "What is missing? 1, 4, 9, __, 25", "options": ["12", "14", "16", "18"], "answer_index": 2, "feedback": "16! These are square numbers: 1²,2²,3²,4²,5²"},
            ],
        },
    },

    # ═══════════════════════════════════════════════════════════
    # DYSGRAPHIA
    # ═══════════════════════════════════════════════════════════
    {
        "key": "dg_space_squad",
        "ld_type": "dysgraphia",
        "title": "Space Squad",
        "description": "Find the sentence where words have the correct spacing. No squished words allowed!",
        "icon": "🚀",
        "xp": 50,
        "difficulty": "easy",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 100,
            "questions": [
                {"stem": "Which sentence has correct spacing?", "options": ["Thequick brownfox jumps.", "The quick brown fox jumps.", "The  quick brown  fox jumps.", "Thequickbrownfoxjumps."], "answer_index": 1, "feedback": "One space between each word — that's the rule!"},
                {"stem": "Which sentence has correct spacing?", "options": ["She went tothe shop.", "Shewent to the shop.", "She went to the shop.", "She went tothe  shop."], "answer_index": 2, "feedback": "One space everywhere — clean and clear!"},
                {"stem": "Which sentence has correct spacing?", "options": ["He  likes to play football.", "He likes to play football.", "Helikes to playfootball.", "He likes  toplay football."], "answer_index": 1, "feedback": "Single spaces only between words!"},
                {"stem": "Choose the correctly spaced sentence:", "options": ["My dog isblack and white.", "My dog is black andwhite.", "Mydog is black and white.", "My dog is black and white."], "answer_index": 3, "feedback": "My dog is black and white — perfect spacing!"},
            ],
        },
    },
    {
        "key": "dg_letter_sort",
        "ld_type": "dysgraphia",
        "title": "Letter Sort",
        "description": "Letters are falling! Catch only the ones written the RIGHT way up — reject upside-down and backwards letters!",
        "icon": "🔡",
        "xp": 65,
        "difficulty": "medium",
        "engine": "FallingCatcher",
        "game_config": {
            "target_label": "Catch only the correctly-formed letters!",
            "lives": 3,
            "items": [
                {"label": "A", "correct": True},
                {"label": "∀ (upside-down A)", "correct": False},
                {"label": "E", "correct": True},
                {"label": "Ǝ (reversed E)", "correct": False},
                {"label": "S", "correct": True},
                {"label": "Ƨ (reversed S)", "correct": False},
                {"label": "R", "correct": True},
                {"label": "Я (reversed R)", "correct": False},
                {"label": "K", "correct": True},
                {"label": "ʞ (reversed K)", "correct": False},
                {"label": "P", "correct": True},
                {"label": "ꟼ (reversed P)", "correct": False},
            ],
        },
    },
    {
        "key": "dg_copy_dash",
        "ld_type": "dysgraphia",
        "title": "Copy Challenge",
        "description": "A sentence will flash on screen. Read it carefully, then answer questions about what you saw!",
        "icon": "📋",
        "xp": 70,
        "difficulty": "medium",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 120,
            "questions": [
                {"stem": "You saw: 'The big red ball bounced high.' — Which word came THIRD?", "options": ["big", "ball", "red", "The"], "answer_index": 2, "feedback": "red — The big RED ball bounced high."},
                {"stem": "You saw: 'She ate a green apple for lunch.' — How many words were there?", "options": ["5", "6", "7", "8"], "answer_index": 2, "feedback": "7 words: She | ate | a | green | apple | for | lunch"},
                {"stem": "You saw: 'My cat slept on the warm mat.' — What did the cat do?", "options": ["Ran outside", "Ate food", "Slept", "Played"], "answer_index": 2, "feedback": "My cat SLEPT on the warm mat"},
                {"stem": "You saw: 'Five blue birds sat on a fence.' — What colour were the birds?", "options": ["Red", "Green", "Yellow", "Blue"], "answer_index": 3, "feedback": "Five BLUE birds sat on a fence"},
                {"stem": "You saw: 'He quickly ran to catch the bus.' — What did he catch?", "options": ["A ball", "The bus", "A train", "A taxi"], "answer_index": 1, "feedback": "He quickly ran to catch THE BUS"},
            ],
        },
    },
    {
        "key": "dg_trace_race",
        "ld_type": "dysgraphia",
        "title": "Trace Race",
        "description": "Match each word to the version that is written correctly — no reversed or jumbled letters!",
        "icon": "✍️",
        "xp": 55,
        "difficulty": "easy",
        "engine": "MatchPairs",
        "game_config": {
            "time_limit": 75,
            "pairs": [
                {"left": "dog", "right": "dog ✓"},
                {"left": "was", "right": "was ✓"},
                {"left": "bed", "right": "bed ✓"},
                {"left": "no", "right": "no ✓"},
                {"left": "saw", "right": "saw ✓"},
                {"left": "top", "right": "top ✓"},
            ],
        },
    },

    # ═══════════════════════════════════════════════════════════
    # NVLD
    # ═══════════════════════════════════════════════════════════
    {
        "key": "nv_emotion_read",
        "ld_type": "nvld",
        "title": "Emotion Match",
        "description": "Read the description of how someone looks or feels, and match it to the correct emotion word.",
        "icon": "😊",
        "xp": 60,
        "difficulty": "easy",
        "engine": "MatchPairs",
        "game_config": {
            "time_limit": 75,
            "pairs": [
                {"left": "Eyes wide, mouth open, eyebrows raised high", "right": "Surprised"},
                {"left": "Eyebrows pulled together, mouth turned down", "right": "Angry"},
                {"left": "Corners of the mouth turned up, eyes crinkled", "right": "Happy"},
                {"left": "Eyes looking down, shoulders drooping", "right": "Sad"},
                {"left": "Pale face, wide eyes, wants to run away", "right": "Scared"},
                {"left": "Nose wrinkled, mouth turned away", "right": "Disgusted"},
            ],
        },
    },
    {
        "key": "nv_map_nav",
        "ld_type": "nvld",
        "title": "Map Navigator",
        "description": "Follow the directions on the map to find where you end up. Build your spatial skills!",
        "icon": "🗺️",
        "xp": 70,
        "difficulty": "medium",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 120,
            "questions": [
                {"stem": "You are facing North. You turn LEFT. What direction are you now facing?", "options": ["North", "South", "East", "West"], "answer_index": 3, "feedback": "West! Turning left from North takes you West."},
                {"stem": "Start at the park. Walk 2 blocks East. Turn left. Walk 1 block. Where is the school?", "options": ["West of the park", "East and North of the park", "South of the park", "Same as the park"], "answer_index": 1, "feedback": "East and North! You went East 2 blocks, then North 1 block."},
                {"stem": "You are facing South. You turn RIGHT twice. What direction are you facing?", "options": ["North", "East", "West", "South"], "answer_index": 0, "feedback": "North! Right from South = West. Right again = North."},
                {"stem": "On a map, the library is to the LEFT of the school. The school is north of the park. Where is the library relative to the park?", "options": ["South-East", "North-West", "South-West", "North-East"], "answer_index": 1, "feedback": "North-West! School is north, library is to the left (west) of school."},
                {"stem": "You walk 3 steps forward, 2 steps right, 3 steps backward. Your net movement is:", "options": ["2 steps right", "3 steps forward", "2 steps left", "Back to start"], "answer_index": 0, "feedback": "2 steps right! Forward and backward cancel out."},
            ],
        },
    },
    {
        "key": "nv_shape_fit",
        "ld_type": "nvld",
        "title": "Shape Puzzle",
        "description": "Match each shape to its mirror image or rotated version. Train your spatial memory!",
        "icon": "🧩",
        "xp": 65,
        "difficulty": "medium",
        "engine": "MatchPairs",
        "game_config": {
            "time_limit": 90,
            "pairs": [
                {"left": "▶ (pointing right)", "right": "◀ (pointing left)"},
                {"left": "△ (pointing up)", "right": "▽ (pointing down)"},
                {"left": "⬛ rotated 45°", "right": "◆ (diamond)"},
                {"left": "↗ (up-right arrow)", "right": "↙ (down-left arrow)"},
                {"left": "🔺 small triangle top", "right": "🔻 small triangle bottom"},
                {"left": "◐ (left half dark)", "right": "◑ (right half dark)"},
            ],
        },
    },
    {
        "key": "nv_social_cue",
        "ld_type": "nvld",
        "title": "Social Decoder",
        "description": "Read the social situation and choose the best response. Learn how to read between the lines!",
        "icon": "🤝",
        "xp": 80,
        "difficulty": "hard",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 150,
            "questions": [
                {"stem": "Your friend says 'I'm FINE' but crosses their arms and looks away. They probably feel:", "options": ["Happy and relaxed", "Upset but not saying so", "Bored", "Excited"], "answer_index": 1, "feedback": "When words and body language don't match, trust the body language!"},
                {"stem": "Someone sighs loudly and taps their foot while you're talking. They are probably:", "options": ["Enjoying the conversation", "Tired from exercise", "Impatient or bored", "Cold"], "answer_index": 2, "feedback": "Sighing + foot tapping = impatience. They may want to leave."},
                {"stem": "You tell a joke and no one laughs. The polite thing to do is:", "options": ["Repeat the joke louder", "Move on and keep talking", "Ask why no one laughed", "Leave immediately"], "answer_index": 1, "feedback": "Move on gracefully! Not every joke lands, and that's okay."},
                {"stem": "A classmate says 'Nice haircut' with a smirk. This is probably:", "options": ["A genuine compliment", "Sarcasm", "A question", "An apology"], "answer_index": 1, "feedback": "Smirking + compliment often = sarcasm. Context and tone matter!"},
                {"stem": "Your friend looks down and goes quiet when you ask about their test. They probably:", "options": ["Didn't take the test", "Did poorly and feel embarrassed", "Got full marks", "Forgot you asked"], "answer_index": 1, "feedback": "Looking down + going quiet = they feel bad about something."},
            ],
        },
    },

    # ═══════════════════════════════════════════════════════════
    # APD
    # ═══════════════════════════════════════════════════════════
    {
        "key": "apd_word_echo",
        "ld_type": "apd",
        "title": "Word Echo",
        "description": "A word or phrase will appear briefly, then disappear. Can you remember and identify it?",
        "icon": "💬",
        "xp": 65,
        "difficulty": "medium",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 120,
            "flash_duration_ms": 1500,
            "questions": [
                {"stem": "You briefly saw: [UMBRELLA] — Which word did you see?", "options": ["UNDER", "UMBRELLA", "UNBELIEVABLE", "UPSTAIRS"], "answer_index": 1, "feedback": "UMBRELLA! Great visual memory."},
                {"stem": "You briefly saw: [THURSDAY AFTERNOON] — What did it say?", "options": ["THURSDAY EVENING", "TUESDAY AFTERNOON", "THURSDAY AFTERNOON", "FRIDAY AFTERNOON"], "answer_index": 2, "feedback": "THURSDAY AFTERNOON — two words, both matter!"},
                {"stem": "You briefly saw: [43] — What number was it?", "options": ["34", "43", "44", "33"], "answer_index": 1, "feedback": "43! Digit order matters — 4 then 3."},
                {"stem": "You briefly saw: [BLUE CAT RUNS] — Complete: BLUE ___ RUNS", "options": ["DOG", "CAT", "HAT", "RAT"], "answer_index": 1, "feedback": "BLUE CAT RUNS — the middle word was CAT"},
                {"stem": "You briefly saw: [PENCIL] — How many letters?", "options": ["5", "6", "7", "8"], "answer_index": 1, "feedback": "PENCIL has 6 letters: P-E-N-C-I-L"},
            ],
        },
    },
    {
        "key": "apd_step_follow",
        "ld_type": "apd",
        "title": "Step Follower",
        "description": "Read the multi-step instructions carefully. They will disappear — then answer questions!",
        "icon": "📋",
        "xp": 75,
        "difficulty": "hard",
        "engine": "MultipleChoice",
        "game_config": {
            "time_limit": 150,
            "flash_duration_ms": 4000,
            "questions": [
                {"stem": "Instructions: 'First clap twice, then stamp your foot, then say your name.' — What do you do SECOND?", "options": ["Clap twice", "Say your name", "Stamp your foot", "Wave your hand"], "answer_index": 2, "feedback": "Stamp your foot! First=clap, SECOND=stamp, Third=say name."},
                {"stem": "Instructions: 'Touch your nose, blink three times, then touch your left shoulder.' — What do you do LAST?", "options": ["Touch nose", "Blink three times", "Touch left shoulder", "Touch right shoulder"], "answer_index": 2, "feedback": "Touch your LEFT shoulder — the last of 3 steps!"},
                {"stem": "Instructions: 'Open the red book, turn to page 5, read the first sentence, then close it.' — How many steps are there?", "options": ["3", "4", "5", "2"], "answer_index": 1, "feedback": "4 steps: open, turn, read, close!"},
                {"stem": "Instructions: 'Put the blue box ON TOP of the yellow box, then put both under the table.' — Where do the boxes end up?", "options": ["On the table", "Under the table", "Next to the table", "On top of each other only"], "answer_index": 1, "feedback": "Under the table — the final position after both steps!"},
                {"stem": "Instructions: 'Pick up the ball, pass it to the person on your RIGHT, then sit down.' — Who gets the ball?", "options": ["Person on your left", "Person behind you", "Person on your right", "You keep it"], "answer_index": 2, "feedback": "The person on your RIGHT receives the ball."},
            ],
        },
    },
    {
        "key": "apd_rhyme_id",
        "ld_type": "apd",
        "title": "Rhyme Radar",
        "description": "Words are falling! Catch only the words that RHYME with the target word shown at the top.",
        "icon": "🎵",
        "xp": 55,
        "difficulty": "easy",
        "engine": "FallingCatcher",
        "game_config": {
            "target_label": "Catch words that rhyme with: LIGHT",
            "lives": 3,
            "items": [
                {"label": "night", "correct": True},
                {"label": "dark", "correct": False},
                {"label": "right", "correct": True},
                {"label": "moon", "correct": False},
                {"label": "bright", "correct": True},
                {"label": "lamp", "correct": False},
                {"label": "might", "correct": True},
                {"label": "glow", "correct": False},
                {"label": "sight", "correct": True},
                {"label": "soft", "correct": False},
                {"label": "flight", "correct": True},
                {"label": "shine", "correct": False},
            ],
        },
    },
    {
        "key": "apd_sound_sort",
        "ld_type": "apd",
        "title": "Sound Sort",
        "description": "Match each sound word to the object that makes it. Train your ear-to-word connection!",
        "icon": "🔊",
        "xp": 60,
        "difficulty": "easy",
        "engine": "MatchPairs",
        "game_config": {
            "time_limit": 75,
            "pairs": [
                {"left": "Tick-tock", "right": "Clock"},
                {"left": "Woof", "right": "Dog"},
                {"left": "Sizzle", "right": "Frying pan"},
                {"left": "Crash", "right": "Thunder"},
                {"left": "Buzz", "right": "Bee"},
                {"left": "Drip", "right": "Tap / Faucet"},
            ],
        },
    },
]

# Build lookup maps at import time
ACTIVITY_BY_KEY = {a["key"]: a for a in ACTIVITIES}
ACTIVITIES_BY_LD = {}
for act in ACTIVITIES:
    ACTIVITIES_BY_LD.setdefault(act["ld_type"], []).append(act)
