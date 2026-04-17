import os

# Define the comprehensive game specification
glint_spec = """# Game Specification: GLINT

## 1. Overview
**Title:** GLINT
**Genre:** Asymmetric Mathematical Drafting & Social Deduction
**Players:** 2–6
**Objective:** Be the first player to reach 40 points.
**Theme:** Goblins scavenging for "treasures" (Banana peels, gems, etc.). Goblins do not use currency; value is subjective and changes every round.

---

## 2. Components
* **Treasures (N+1):** Physical items equal to Player Count (N) + 1 (The "Dummy" item).
* **Item Cards:** Matching cards for each Treasure to track ownership.
* **Value Cards:** A deck of cards numbered 0–9. These determine the "Glint" (points) of an item.
* **Number Deck:** A deck of cards numbered 0–9 (4–8 sets of each).
* **Target Generator:** A method to generate a 2-digit "Target Number" (10–99).

---

## 3. Game State & Setup
* **Score:** Players start at 0.
* **Treasure Assignment:** At the start of each round, one Treasure is placed in front of each player. The +1 Treasure is placed in the center as the "Dummy."
* **The Glint (Valuation):** One Value Card is dealt face-down under each Item Card.
* **Player Knowledge:** Players may look ONLY at the Value Card under their assigned item. All other values are hidden.
* **Math Hand:** Each player is dealt 4 cards from the Number Deck.

---

## 4. Phase 1: The Declaration (The Social Meta)
Players must declare their intent clockwise. This creates the "Economic State" of the round.

### Option A: BOAST
* **Logic:** "I believe my item is high value."
* **Constraint (Lock-in):** The player is committed to their item. They CANNOT draft any other item unless theirs is stolen by another player first.
* **Benefit (Safety Net):** If the round ends and no one drafted their item, they take it by default (even if they fail the math).
* **Information:** No additional info gained.

### Option B: SNEAK
* **Logic:** "I want to steal something better."
* **Benefit (The Peek):** The player peeks at the Value Card of ONE other item (another player's or the Dummy).
* **Constraint (Lock-out):** The player CANNOT draft their own item this round. It is discarded from their options.
* **Information:** Gains knowledge of a second value.

---

## 5. Phase 2: The Scramble (The Math)
A Target Number (10–99) is revealed. There is no fixed timer to start.

1. **The Call:** The round is open-ended until a player shouts "GLINT!"
2. **The Fuse:** Once "GLINT!" is called, a **10-second scramble timer** begins for all other players.
3. **The Results:**
    * **Solvers:** Players who submitted a formula before the fuse expired. They must track their **Distance** (absolute difference between their result and the Target).
    * **Failures/Give Ups:** Players who did not submit a formula or chose to "Give Up." They receive a fixed **Distance Penalty of 3**.

---

## 6. Phase 3: The Looting (The Draft)
Drafting priority is determined by the order in which players submitted their math.

1. **First Solver:** Drafts first.
    * If a **Boaster**: Must take their own item (unless it was stolen by a faster "Sneaker" - impossible for 1st solver).
    * If a **Sneaker**: Takes any item except their own.
2. **Subsequent Solvers:** Draft in order.
    * If a **Boaster**: Must take their own item if available. If stolen, they are now a Free Agent and can take any available item.
    * If a **Sneaker**: Takes any available item except their own.
3. **Safety Net Resolution:** Any Boaster who has not yet drafted (failed math or slow) and whose item is still available takes their item now.
4. **Scavenge:** All remaining players pick from leftovers in reverse order of their current game score (catch-up mechanic).

---

## 7. Phase 4: Scoring
Once everyone has exactly one treasure, reveal the Value Cards.
* **Formula:** `Round Points = (Value Card) - (Distance from Target)`
* **Minimum:** Points for a round cannot be less than 0.
* **Give Up Penalty:** If a player Gave Up, their formula is `Value Card - 3`.

---

## 8. Win Condition
* **Trigger:** A player reaches 40 points at the end of a round.
* **Tie-Breaker:** 1. Highest total score.
    2. Fewest number of Treasure Tokens collected (Quality over Quantity).
    3. Most "Exact" (0-distance) solutions achieved.

---

## 9. AI Simulation Personas (For Agents)
1. **The Math Whiz:** Always goes for "Exact," even if it takes 20 seconds.
2. **The Goblin Speedster:** Shouts "Glint!" as soon as they are within 2 of the target to trigger the 10s fuse.
3. **The Logical Bluffer:** Boasts on low numbers to trick others into stealing "trash."
4. **The Cautious Scavenger:** Sneaks to find the Dummy value, then "Gives Up" to pick it safely if they can't solve math quickly.
"""

# Save to a markdown file
file_name = "glint_game_specification_v1.md"
with open(file_name, "w") as f:
    f.write(glint_spec)

print(f"File {file_name} created successfully.")