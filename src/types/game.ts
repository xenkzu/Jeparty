export interface Game {
  players: Player[];
  categories: string[];
  board: Board;
  scoringMode: ScoringMode;
  turnIndex: number;
  currentQuestion: {
    categoryIndex: number;
    questionIndex: number;
  } | null;
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
  }[];
}

export type Board = BoardCategory[];
