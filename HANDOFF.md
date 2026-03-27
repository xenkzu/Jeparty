# 🚀 Jeparty - Senior Developer Handoff Document

## 📋 Project Overview
**Jeparty** is a web-based party game inspired by Jeopardy, built for a fun, interactive experience with multiple players. It's designed to be lightweight, performant, and high-quality, focusing on clean code and a premium UI/UX.

---

## 🛠️ Technology Stack
- **Core**: React 18 (Functional Components & Hooks)
- **Tooling**: Vite (Fastest build tool and dev server)
- **Type Safety**: TypeScript (Strict mode enabled)
- **Styling**: TailwindCSS (Utility-first CSS for rapid, modern design)
- **State Management**: React Native `useState`/`useCallback` (No external state libraries like Redux to keep it lightweight)
- **Routing**: Custom state-based navigation (Simple and effective for this use case)

---

## 📂 Architecture & Folder Structure

The project follows a scalable, modular architecture:

```
src/
├── components/         # Reusable UI elements
│   ├── ui/             # Atomic components (Button, Card, Title)
│   └── game/           # Game-specific sub-components (CategoryColumn)
├── screens/            # Main game views/routes
│   ├── Setup/          # Game configuration screen
│   ├── GameBoard/      # The main grid of questions
│   ├── QuestionModal/  # Question display and interaction
│   └── EndScreen/      # Final results and restart option
├── hooks/              # Custom React hooks (e.g., useGame)
├── state/              # Global state management placeholders
├── utils/              # Helper functions (formats, shuffles)
├── types/              # TypeScript interface definitions
└── constants/          # Static game data and configuration
```

---

## 🔄 Current Implementation State

### 🎨 Design System
- Modern, "glassmorphism" aesthetic using semi-transparent containers and Tailwind's backdrop-blur.
- Consistent color palette (Blues for UI, Yellows for points, Green/Red for feedback).
- Responsive layout with a clean, dark-mode-first appearance.

### 🛤️ Navigation & Routing
- Handled in `App.tsx` via a `currentScreen` state.
- Supports basic forward and backward navigation (e.g., from `QuestionModal` back to `GameBoard`).

### 📦 Key Components
- **`QuestionModal.tsx`**: A high-impact modal that presents questions and handles answer validation.
- **`CategoryColumn.tsx`**: A dynamic grid column for categories and point values.
- **`useGame.ts`**: A custom hook that encapsulates scoring and game state logic.

---

## 🚦 Getting Started for Developers

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run dev server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🧭 Roadmap & Recommended Next Steps

1. **Persist State**: Implement LocalStorage for game persistence in case of page refresh.
2. **AI Integration**: The `AI-questions.md` file contains ideas for generating questions using AI. This is a high-priority feature.
3. **Sound Effects**: Add subtle UI sounds and a countdown timer for answering.
4. **Multiplayer Sync**: Explore WebSockets (e.g., Socket.io) if real-time remote play is needed later.
5. **Animation Polish**: Enhance transitions between screens using Framer Motion or simple CSS transitions.

---

## 📝 Final Notes
The project is in its early, "clean-slate" phase. The foundation is solid, type-safe, and ready for feature expansion. Focus on maintaining the **Modern/Premium UI** aesthetic as you add new features.

---
*Created by Antigravity AI - March 2026*
