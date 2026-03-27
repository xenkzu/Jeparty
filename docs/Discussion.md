# Jeopardy Party Game — System Specification (AI Reference)

## Product Type
Casual party game (host-controlled, local play, no multiplayer sync)

---

## Core Concept
A Jeopardy-style game where:
- Host inputs players + categories
- AI generates all questions
- Host controls gameplay flow
- Players answer verbally
- System tracks score + turns

---

## Game Flow Overview

1. Setup → Input players + categories
2. AI generates full board (25 questions)
3. Game loop:
   - Player selects question
   - Host reads question
   - Reveal answer
   - Assign score (correct / wrong / pass)
4. Repeat until all questions are used
5. Show winner + final scores

---

## Host Interaction Model

All gameplay is controlled by host.

### Question Flow
- Click tile → open question modal
- Show question
- "Reveal Answer" button
- Then show:
  - ✅ Correct
  - ❌ Wrong
  - ⏭ Pass

No navigation. No multiple screens. One continuous loop.

---

## Scoring System

### Default Mode (Normal)
- Correct → +points
- Wrong → -points
- Pass → -½ points

### Advanced Mode (Optional Setting)
- Correct → +points
- Wrong → -¾ points
- Pass → -½ of wrong penalty

### Rules
- All calculations must be automatic
- UI must display score change before confirming

---

## AI Question Generation

### Input
- 5 categories from host

### Output
- 5 questions per category
- Values: 100, 200, 300, 400, 500

### Requirements
- Generate ALL 25 questions in ONE API call
- Store in frontend state (no DB required)

### Controls
- Regenerate category
- Edit question + answer inline

### Loading
- Single loading screen before game starts
- No loading during gameplay

---

## Passing System

- If player fails → host selects "Pass"
- Host manually chooses next player
- No automatic passing logic

---

## Comeback Mechanic

### Underdog Boost
- Lowest scoring player gets:
  - 1.5× points on their turn
- Automatically updates as scores change

No randomness. No popups.

---

## Game State Structure

Single centralized state object:

```js
Game {
  players: [
    { name: string, score: number }
  ],

  turnIndex: number,

  board: [
    {
      category: string,
      questions: [
        {
          value: number,
          question: string,
          answer: string,
          status: "hidden" | "active" | "answered"
        }
      ]
    }
  ],

  currentQuestion: {
    categoryIndex: number,
    questionIndex: number
  } | null,

  settings: {
    scoringMode: "normal" | "advanced"
  },

  gameStatus: "setup" | "loading" | "playing" | "finished"
}