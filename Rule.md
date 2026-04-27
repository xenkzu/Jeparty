# JEPARTY_OS: OFFICIAL GAMEPLAY PROTOCOLS

## 1. TURN STRUCTURE (CORE_LOOP)
- **Initiation**: The player who last answered correctly (or the first player in the list at the start) chooses a category and a point value.
- **Selection**: Once a tile is clicked, the question is revealed. The game enters "Locked" state where only that question is active.
- **Answering**: Any player can attempt to answer. The Moderator must manually award or deduct points based on the player's verbal response.
- **Resolution**: 
    - If a player is correct: They get the full points and the moderator moves to the next question.
    - If a player is incorrect: The points are deducted and the moderator moves to the next question.
- **Skipping**: If no one knows the answer, the Moderator can reveal the answer and close the question. No points are awarded or deducted, and board control stays with the player who originally chose the question.

## 2. SCORING SYSTEM (POINT_CALCULATION)
- **Correct Answer**: 
    - The player receives the full point value shown on the tile (e.g., +200, +400).
- **Incorrect Answer**: 
    - The full point value of the tile is **subtracted** from the player's total score (e.g., -200, -400).
- **Advanced Mode**: 
    - In this mode, points are calculated with higher stakes, but the base rule remains: Correct = full tile value added; Incorrect = full tile value subtracted.

## 3. MODERATOR COMMANDS (SYSTEM_OVERRIDE)
- **Active Moderator**: The current "Active" player is highlighted with a technical shine and power-hum animation.
- **Award/Deduct**: The Moderator uses the `+` and `-` buttons in the question portal to update scores.
- **Question Refresh (Retry)**: 
    - **Visual**: moderator can swap the image if it's unclear. (Does not change points or answer).
    - **Audio**: Moderator can swap the song if the link is dead. (Fetches a brand new question/answer).

## 4. GAME END (FINAL_READOUT)
- The game continues until all tiles on the board have been cleared.
- Once the final question is resolved, the system transitions to the **End Screen** for the final score tally and ranking.
- **Final Ranking**: Players are ranked by their total points. The highest score is designated as the primary winner.
