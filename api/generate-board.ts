import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Handle CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { categories } = req.body;
  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({ error: 'Missing or invalid categories' });
  }

  const API_KEY = process.env.VITE_GROQ_API_KEY;
  const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL = 'qwen/qwen3-32b';

  const visualCategories = categories.filter(c => c.toLowerCase().endsWith(' -v'));
  const promptCategories = categories.map(c => c.replace(/ -v$/i, ''));
  
  const prompt = `Generate a complete Jeopardy game board for these 5 categories: ${promptCategories.join(', ')}.
      Return ONLY valid JSON, no markdown, no backticks, no explanation.
      A JSON array of exactly 5 objects: { category: string, questions: [] }
      Each question object: { value: number, question: string, answer: string, status: 'hidden', searchTerm?: string }
      
      SPECIAL INSTRUCTION:
      For [VISUAL] categories ([${visualCategories.map(c => c.replace(/ -v$/i, '')).join(', ')}]), the searchTerm field must follow these strict rules:
       - Only generate questions about real people, historical figures, world landmarks, scientists, athletes, or politicians.
       - These must all have Wikipedia pages with thumbnail images.
       - searchTerm must be the exact Wikipedia page title.
       - GOOD examples: 'Albert Einstein', 'Eiffel Tower', 'Cristiano Ronaldo', 'Nelson Mandela', 'Mount Everest', 'Leonardo da Vinci'
       - BAD examples: anime characters, fictional objects, cartoon characters, pokemon, game characters — do NOT generate these for visual questions.
       - The answer field must match the searchTerm subject exactly.
       - The question text should be "Guess the character" or "Who is this?".
      
      For all other categories, DO NOT include a searchTerm field.
      Make questions fun/casual. Each category must have exactly 5 questions (100, 200, 300, 400, 500).`;

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
        reasoning_format: "hidden"
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        error: `Groq API Error: ${errorData.error?.message || response.statusText}` 
      });
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content;

    if (!text) {
      return res.status(500).json({ error: 'No content returned from Groq' });
    }

    // Strip any markdown code fences
    text = text.replace(/```json\n?|```/g, '').trim();

    try {
      const board = JSON.parse(text);
      // Basic structure validation
      if (!Array.isArray(board) || board.length !== 5) {
        throw new Error('Expected 5 categories');
      }
      return res.status(200).json(board);
    } catch (parseError) {
      console.error('JSON Parse failed:', text);
      return res.status(500).json({ error: 'AI returned invalid JSON structure' });
    }

  } catch (error) {
    console.error('Serverless function failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
