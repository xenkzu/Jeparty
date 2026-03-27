import { Board } from '../types/game';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Generates a complete Jeopardy game board using Google Gemini 2.0 Flash.
 *
 * @param categories - Array of 5 category names to generate questions for.
 * @returns A promise that resolves to a Board object (typed Categories with Questions).
 */
export const generateBoard = async (categories: string[]): Promise<Board> => {
  const prompt = `Generate a complete Jeopardy game board for these 5 categories: ${categories.join(', ')}.
      Return ONLY valid JSON, no markdown, no backticks, no explanation.
      A JSON array of exactly 5 objects, each shaped as:
      { category: string, questions: [{ value: 100|200|300|400|500, question: string, answer: string, status: 'hidden' }] }
      Make questions fun for a casual party. Each category must have exactly 5 questions.`;

  try {
    if (!API_KEY) {
      throw new Error('VITE_GEMINI_API_KEY is not defined in the environment.');
    }

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No content returned from Gemini.');
    }

    // Strip any markdown code fences if Gemini ignores instructions
    text = text.replace(/```json\n?|```/g, '').trim();

    const board: Board = JSON.parse(text);

    // Basic structure validation
    if (!Array.isArray(board) || board.length !== 5) {
      throw new Error('AI returned an invalid board structure. Expected 5 categories.');
    }

    return board;
  } catch (error) {
    console.error('Board Generation Failure:', error);
    throw error instanceof Error ? error : new Error('Fatal error generating AI board.');
  }
};

export default generateBoard;
