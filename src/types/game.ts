export type Screen = 'SETUP' | 'GAME' | 'QUESTION' | 'END' | 'RULES';

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: 30 | 60 | 0;
  questionsPerCategory: 3 | 5 | 7;
  scoringMode: ScoringMode;
  uiVersion: 'v1' | 'v2' | 'v3';
}

export interface SkipChain {
  originalPlayerIndex: number;    // who passed first (Dev1)
  originalTurnIndex: number;      // turnIndex value when pass happened
  passedPlayerIndices: number[];  // players who have already seen this question
  currentRecipientIndex: number;  // who is currently answering
}

export interface Game {
  players: Player[];
  categories: string[];
  board: Board;
  scoringMode: ScoringMode;
  settings: GameSettings;
  turnIndex: number;
  currentQuestion: {
    categoryIndex: number;
    questionIndex: number;
  } | null;
  skipChain: SkipChain | null;    // null = no skip chain active
}

export type ScoringMode = 'normal' | 'advanced';

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  currentScreen: 'SETUP' | 'GAME' | 'QUESTION' | 'END';
  score: number;
}

export interface Question {
  id: string;
  category: string;
  points: number;
  question: string;
  answer: string;
  wasAnswered: boolean;
}

export interface BoardCategory {
  category: string;
  questions: {
    value: number;
    question: string;
    answer: string;
    status: 'hidden' | 'revealed' | 'answered';
    searchTerm?: string;
    searchTermAudio?: string;
    source?: string | null;
    popularityRank?: number | null;
  }[];
}

export type Board = BoardCategory[];
