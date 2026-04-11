import { Board, GameSettings } from '../types/game';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Point values by questionsPerCategory
const POINT_VALUES: Record<number, number[]> = {
  3: [100, 300, 500],
  5: [100, 200, 300, 400, 500],
  7: [100, 200, 300, 400, 500, 600, 700],
};

const DIFFICULTY_INSTRUCTION: Record<string, string> = {
  easy: 'Generate casual, well-known trivia. Questions should be common knowledge that most people at a party would know. Pop culture, basic facts, famous names.',
  medium: 'Generate moderately difficult trivia. Questions should require genuine knowledge of the topic. More specific facts, less obvious answers, niche but not obscure.',
  hard: 'Generate expert-level trivia. Questions should be very specific and niche. Only true enthusiasts or experts would know these answers. Avoid obvious facts, focus on deep knowledge of the category.',
};

function buildPrompt(categories: string[], settings: GameSettings): string {
  const { difficulty, questionsPerCategory } = settings;
  const pointValues = POINT_VALUES[questionsPerCategory];
  const visualCategories = categories.filter(c => c.toLowerCase().endsWith(' -v'));
  const audioCategories = categories.filter(c => c.toLowerCase().endsWith(' -a'));
  const promptCategories = categories.map(c => c.replace(/\s*-[v|a]\s*$/i, '').trim());

  return `Generate a complete Jeopardy game board for these 5 categories: ${promptCategories.join(', ')}.
      Return ONLY valid JSON, no markdown, no backticks, no explanation.
      A JSON array of exactly 5 objects: { category: string, questions: [] }
      Each question object: { value: number, question: string, answer: string, status: 'hidden', searchTerm?: string, searchTermAudio?: string }

      DIFFICULTY: ${DIFFICULTY_INSTRUCTION[difficulty]}

      SPECIAL INSTRUCTION:
      For [VISUAL] categories ([${visualCategories.map(c => c.replace(/\s*-v\s*$/i, '').trim()).join(', ')}]), generate questions that match the category theme exactly.
      However, only generate questions about subjects that have a real Wikipedia page with a thumbnail image.

      Rules:
       - ALWAYS respect the category name and generate questions within that theme
       - For anime categories: use real anime characters that have Wikipedia pages
         GOOD: 'Naruto Uzumaki', 'Goku', 'Monkey D. Luffy', 'Light Yagami'
       - For sports categories: use real athletes with Wikipedia pages
         GOOD: 'Cristiano Ronaldo', 'LeBron James', 'Virat Kohli'
       - For geography/landmarks: use real places with Wikipedia pages
         GOOD: 'Eiffel Tower', 'Mount Everest', 'Taj Mahal'
       - For science categories: use real scientists or discoveries with Wikipedia pages
         GOOD: 'Albert Einstein', 'Isaac Newton', 'DNA double helix'
       - For ANY category: pick the most famous and recognizable subjects first
         as they are most likely to have Wikipedia thumbnail images
       - NEVER generate questions about obscure subjects unlikely to have Wikipedia images
       - searchTerm must be the exact Wikipedia page title for that subject
       - imageSource stays 'wikipedia' for all visual questions
       - The answer field must match the searchTerm subject exactly.
       - The question text should be "Guess the character" or "Who is this?".

      For [AUDIO] categories ([${audioCategories.map(c => c.replace(/\s*-a\s*$/i, '').trim()).join(', ')}]), generate music trivia questions where players must identify a song.
        - Set "searchTermAudio" to the song title and artist (e.g. "Bohemian Rhapsody Queen", "Billie Jean Michael Jackson").
        - The "question" field should say something like "Guess the song:" or "Name this track:" — never reveal the title/artist in the question text.
        - DO NOT set "searchTerm" (image) for audio questions. Only set "searchTermAudio".
        - The "answer" field must be the song title and artist.

      For all other categories, DO NOT include a searchTerm or searchTermAudio field.
      Make questions fun/casual. Each category must have exactly ${questionsPerCategory} questions with point values: ${pointValues.join(', ')}.

      QUESTION QUALITY RULES — follow strictly:
       1. Every question MUST be phrased as a question ending with a '?'
          GOOD: 'What is the capital of France?'
          BAD: 'The capital of France', 'Name the capital of France'

       2. Every answer must be short and specific — 1 to 4 words maximum
          GOOD: 'Paris', 'Albert Einstein', 'The Eiffel Tower'
          BAD: 'It is Paris', 'The answer is Einstein'

       3. Questions must NEVER repeat within the same category
          Each of the ${questionsPerCategory} questions must test a completely different aspect of the category

       4. Questions must NEVER be ambiguous — only one correct answer is possible

      DIFFICULTY SCALING RULES — strictly follow for every category:
       ${pointValues.map((v, i) => {
    const labels = ['Extremely easy — anyone would know this', 'Easy — most people would know', 'Medium — requires some knowledge', 'Hard — requires strong knowledge', 'Expert level — enthusiasts/experts only', 'Very expert — deep niche knowledge', 'Master level — almost nobody knows this'];
    return `${v} points → ${labels[Math.min(i, labels.length - 1)]}`;
  }).join('\n       ')}

       The difficulty jump between each tier must be noticeable.
       Generate questions in order: ${pointValues[0]} first (easiest) → ${pointValues[pointValues.length - 1]} last (hardest)`;
}

/**
 * Generates a complete Jeopardy game board.
 * In production (Vercel): calls the /api/generate-board serverless function.
 * In dev (Vite): calls Groq directly to avoid 404 on missing serverless routes.
 */
export const generateBoard = async (categories: string[], settings: GameSettings): Promise<Board> => {
  try {
    let board: Board;
    const qCount = settings.questionsPerCategory;

    if (import.meta.env.DEV) {
      // ─── DEV MODE: Call Groq directly, fall back to mock if offline ──
      if (!GROQ_API_KEY) {
        console.warn('[DEV] No API key found — using mock board');
        board = generateMockBoard(categories, settings);
      } else {
        try {
          board = await fetchBoardFromGroq(categories, settings);
        } catch (e) {
          console.error('[DEV] Groq API call failed. Check your API key and network. Error:', e);
          board = generateMockBoard(categories, settings);
        }
      }
    } else {
      // ─── PROD MODE: Call Vercel serverless function ───────────────
      const response = await fetch('/api/generate-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, settings })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      board = await response.json();
    }

    // Verify board structure with variable question count
    if (!Array.isArray(board) || board.length !== 5) {
      throw new Error('Invalid board structure from AI: Expected 5 categories');
    }

    for (const cat of board) {
      if (!cat.category || !Array.isArray(cat.questions) || cat.questions.length !== qCount) {
        throw new Error(`Invalid board structure from AI: Each category must have ${qCount} questions`);
      }
    }

    return board;
  } catch (error) {
    console.error('Board Generation Failure:', error);
    throw error instanceof Error ? error : new Error('Fatal error generating AI board.');
  }
};

/**
 * Direct Groq call for local development (mirrors api/generate-board.ts prompt).
 */
async function fetchBoardFromGroq(categories: string[], settings: GameSettings): Promise<Board> {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY is not defined in .env');
  }

  const prompt = buildPrompt(categories, settings);

  const response = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 5000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  let text = data.choices[0]?.message?.content;

  if (!text) throw new Error('No content returned from Groq.');

  text = text.replace(/```json\n?|```/g, '').trim();
  
  // Robust JSON extraction: Find the first '[' and last ']'
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) {
    text = text.substring(firstBracket, lastBracket + 1);
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('Failed to parse AI JSON. Raw text:', text);
    throw parseError;
  }
}

/**
 * Generates a mock board for offline dev testing.
 */
function generateMockBoard(categories: string[], settings: GameSettings): Board {
  const values = POINT_VALUES[settings.questionsPerCategory];
  return categories.map(cat => {
    const isVisual = cat.toLowerCase().endsWith(' -v');
    const isAudio = cat.toLowerCase().endsWith(' -a');
    const cleanCat = cat.replace(/\s*-[v|a]\s*$/i, '').trim();
    
    return {
      category: cleanCat,
      questions: values.map((v, i) => ({
        value: v,
        question: isAudio ? "Guess the song:" : `[MOCK] ${cleanCat} question #${i + 1} for ${v} points?`,
        answer: isAudio ? `Mock Song ${i + 1}` : `Mock Answer ${i + 1}`,
        status: 'hidden' as const,
        ...(isVisual ? { searchTerm: 'Albert Einstein' } : {}),
        ...(isAudio ? { searchTermAudio: 'Bohemian Rhapsody Queen' } : {})
      }))
    };
  });
}

export default generateBoard;
