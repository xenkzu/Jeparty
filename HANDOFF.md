# Jeparty - Project Handoff Document

Welcome to the **Jeparty** project! This document is designed for senior developers to quickly understand the project architecture, stack, and workflows so they can hit the ground running.

## 1. Project Overview
**Jeparty** is a casual, host-controlled local party game inspired by Jeopardy. It does not use multiplayer sync (like WebSockets)—instead, a single host controls the game state on one machine, likely displaying it on a shared screen (e.g., via HDMI or ChromeCast). It uses AI to dynamically generate trivia categories and questions, accommodating different difficulties and visual question types.

## 2. Tech Stack
The project runs entirely on a modern JavaScript/TypeScript ecosystem.

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS / PostCSS
- **Language**: TypeScript (v5.2+)
- **State Management**: React state hooks (`useState`, `useEffect`) managed top-down from `App.tsx`.

### Backend & API
- **Deployment & Serverless Environment**: Vercel
- **Serverless Functions**: `@vercel/node` is used for creating backend endpoints located in the `/api` folder.
- **AI Integration**: Groq API using the `qwen/qwen3-32b` model to dynamically construct standard and visual trivia questions in JSON format.

## 3. Architecture & Data Flow

### The Pipeline
The general flow of data in the app is straightforward:
1. **Setup Phase**: The host inputs the player names, chooses categories, and adjusts game settings (difficulty, time limit, questions per category).
2. **Board Generation**:
   - The frontend calls the `generateBoard` service (`src/services/aiService.ts`).
   - If running locally (dev), it hits the Groq API directly (or falls back to mock questions if offline).
   - In production, it makes a POST request to `/api/generate-board.ts`.
   - The AI returns a highly structured JSON containing categories and exactly calibrated question values, answers, and even search terms for visual queries.
3. **Game Loop**:
   - The state is held in `App.tsx` via `gameState`.
   - The `GameBoard` component (`src/screens/GameBoard`) renders the board.
   - When a category value is clicked, the `QuestionModal` opens.
   - The host scores the players directly. Correct, Wrong, or Pass actions manipulate the player scores and shift the turn index.
   - An "Underdog Boost" logic exists to multiply points for players at the lowest score.

### Visual Categories (Wikipedia Integration)
If the host adds ` -v` to a category (e.g., "Landmarks -v"), the AI knows to specify `searchTerm` fields targeting exact Wikipedia titles. The UI then presumably uses the `/api/fetch-image.ts` endpoint to fetch the Wikipedia thumbnail image based on that search term.

## 4. Key Directories & Files Layout
```text
/c/Projects/jeparty/
├── api/                        # Vercel Serverless Functions
│   ├── fetch-image.ts          # Fetches Wikipedia images (presumably based on AI searchTerm)
│   └── generate-board.ts       # Prompts Groq API to construct the game JSON strictly
├── src/                        # Frontend React source code
│   ├── components/             # Reusable UI elements (Buttons, Cards)
│   ├── screens/                # Main view components
│   │   ├── Setup/              # Game configuration view
│   │   ├── GameBoard/          # The Jeopardy board UI
│   │   ├── QuestionModal/      # Renders the current question and handles scoring
│   │   └── EndScreen/          # Renders winner/loser states
│   ├── services/
│   │   └── aiService.ts        # Service that shapes the API calls (Prod vs Dev env logic)
│   ├── state/
│   │   └── gameStore.ts        # Boilerplate for global state (if you choose to migrate out of App.tsx)
│   ├── styles/                 # Custom Tailwind inputs and CSS Variables
│   ├── types/                  # Shared TS definitions for GameState, Board, and Players
│   └── App.tsx                 # Root component orchestrating views and `gameState`
├── vercel.json                 # Vercel configs (Function timeout extensions, SPA routing)
├── tailwind.config.js          # Tailwind theme mapping and custom utility classes
└── package.json                # Scripts and dependency map
```

## 5. Development & Testing Workflow

### Prerequisites
- Node.js (v18 or v20 recommended)
- `VITE_GROQ_API_KEY` defined in `.env.local`

### Running Locally
1. Clone & install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. To test the Vercel Functions locally, ensure Vercel CLI is installed and run:
   ```bash
   npm run dev:vercel
   ```

*Shortcut Tips*: The codebase has URL parameter fallbacks for testing. Tapping into `?screen=game` natively loads a mock board and dummy players, completely bypassing the Groq AI payload, ensuring you can test UI quickly.

## 6. Design and Aesthetics

The application utilizes a rich, custom design system rather than falling back on plain Tailwind defaults:
- **Themes & Palettes**: Uses custom values mapped out in `tailwind.config.js` and `tokens.css` targeting specific surface colors (`bg-surface-container-lowest`), tertiary containers, etc., simulating a modern "Terminal / Hack" vibe.
- Animations and transitions: Micro-interactions and borders focus on dynamic hover states to replicate a high-end feel.

## 7. Next Steps & Recommended Improvements 
As you pick up the project, here are the likely next targets:
1. **State Refactor**: `App.tsx` has grown quite large (~420 lines). As the game scales, extracting the `gameState` manipulation into `state/gameStore.ts` using Redux toolkit, Zustand, or simple context providers is highly recommended.
2. **Error Handling on the Groq API**: Rate-limiting or hallucination parsing failures from the LLM prompt. The try/catch in `generate-board.ts` is solid, but the frontend could benefit from more robust fallback modes if the serverless function hits a timeout (Vercel maxDuration is set to 30s).
3. **Wikipedia Fetch Optimization**: If `/api/fetch-image.ts` starts becoming a bottleneck during question transitions, consider triggering pre-fetching or a caching layer as soon as the board is generated. 

You're good to dive into `src/App.tsx` to read the game loop!
