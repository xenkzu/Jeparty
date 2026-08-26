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

  const { categories, settings, exclusions = {} } = req.body;
  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({ error: 'Missing or invalid categories' });
  }

  const difficulty: string = settings?.difficulty || 'medium';
  const questionsPerCategory: number = settings?.questionsPerCategory || 5;

  const DIFFICULTY_INSTRUCTION: Record<string, string> = {
    easy: `EASY MODE — follow these rules strictly:
- Every question must be answerable by someone who has never studied the topic
- Only use the most globally famous examples (top 3 most recognizable in any category)
- Question style: direct and obvious — "What color is the sky?", "Who created Mickey Mouse?"
- Answers must be household names or facts taught in primary school
- FORBIDDEN on easy: dates, numbers, specific locations, technical terms, niche references
- Example easy questions:
  Science: "What planet is closest to the Sun?" → "Mercury"
  History: "Who was the first US President?" → "George Washington"
  Movies: "What studio made The Lion King?" → "Disney"
  Maths: "What is 12 × 12?" → "144"`,

    medium: `MEDIUM MODE — follow these rules strictly:
- Questions require genuine topic knowledge — a casual fan would know, a non-fan would not
- Use specific facts, years, character names, sequels, records, and real events
- Avoid the single most obvious answer — pick the second or third most famous example
- Question style: specific but fair — "Which country has won the most FIFA World Cups?"
- FORBIDDEN on medium: trivially obvious facts, questions a child could answer without knowing the topic
- Example medium questions:
  Science: "What element has the atomic symbol Fe?" → "Iron"
  History: "In what year did the Berlin Wall fall?" → "1989"
  Movies: "Who directed Pulp Fiction?" → "Quentin Tarantino"
  Maths: "What is the value of pi to 2 decimal places?" → "3.14"`,

    hard: `HARD MODE — follow these rules strictly:
- Questions should stump most people — only enthusiasts or experts will know the answer
- Use obscure facts, secondary characters, specific dates, record holders, technical details
- Never use the most famous example — go for lesser-known but verifiable facts
- Question style: hyper-specific — "Who scored the winning goal in the 1966 World Cup final?"
- FORBIDDEN on hard: anything answerable by casual knowledge, famous names, obvious facts
- The 100pt question on hard should still be harder than the 500pt question on easy
- Example hard questions:
  Science: "What is the half-life of Carbon-14 in years?" → "5,730 years"
  History: "Which treaty ended the War of 1812?" → "Treaty of Ghent"
  Movies: "Who composed the score for 2001: A Space Odyssey?" → "György Ligeti"
  Maths: "What is Euler's identity?" → "e^iπ + 1 = 0"`,
  };
  const POINT_VALUES: Record<number, number[]> = {
    3: [100, 300, 500],
    5: [100, 200, 300, 400, 500],
    7: [100, 200, 300, 400, 500, 600, 700],
  };
  const pointValues = POINT_VALUES[questionsPerCategory] || POINT_VALUES[5];

  const API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL = 'qwen/qwen3.8-27b';

  const visualCategories = categories.filter(c => c.toLowerCase().endsWith(' -v'));
  const audioCategories = categories.filter(c => c.toLowerCase().endsWith(' -a'));
  const promptCategories = categories.map(c => c.replace(/\s*-[v|a]\s*$/i, '').trim());

  const visualCategoryKeys = visualCategories.map(c => 
    c.replace(/\s*-v\s*$/i, '').trim().toLowerCase()
  );
  const audioCategoryKeys = audioCategories.map(c => 
    c.replace(/\s*-a\s*$/i, '').trim().toLowerCase()
  );

  // Build soft-exclusion paragraph for the prompt
  const exclusionLines = Object.entries(exclusions as Record<string, string[]>)
    .filter(([, topics]) => topics.length > 0)
    .map(([cat, topics]) => {
      // Only send last 25 topics max per category to cap token usage
      const recent = topics.slice(-25);
      const isVisual = visualCategoryKeys.includes(cat);
      const isAudio = audioCategoryKeys.includes(cat);
      
      if (isVisual) {
        return `- "${cat}": these characters are BANNED [${recent.join(', ')}]\n  You MUST pick entirely different characters not on this list. There are hundreds of anime characters — pick ones you haven't used.`;
      }
      if (isAudio) {
        return `- "${cat}": these songs are BANNED [${recent.join(', ')}]\n  You MUST pick entirely different songs not on this list.`;
      }
      return `- "${cat}": BANNED answers [${recent.join(', ')}]. Use completely different facts/people/concepts.`;
    });

  const exclusionBlock = exclusionLines.length > 0
    ? `BANNED ANSWERS — you are FORBIDDEN from using these as answers in ANY question:
${exclusionLines.join('\n')}
This is a HARD constraint. Using any banned answer will make the output invalid.
You MUST generate questions with completely different answers than those listed above.
If a category has 5 banned answers, generate 5 entirely new answers on different subjects.`
    : '';

  const prompt = `${exclusionBlock ? `CRITICAL CONSTRAINT — READ BEFORE GENERATING ANYTHING:
${exclusionBlock}
---
` : ''}Generate a complete Jeopardy game board for these 5 categories: ${promptCategories.join(', ')}.
      Return ONLY valid JSON, no markdown, no backticks, no explanation.
      A JSON array of exactly 5 objects: { category: string, questions: [] }
      Each question object: { value: number, question: string, answer: string, status: 'hidden', searchTerm?: string, searchTermAudio?: string }

      DIFFICULTY: ${DIFFICULTY_INSTRUCTION[difficulty] || DIFFICULTY_INSTRUCTION.medium}

      SPECIAL INSTRUCTION:
      For [VISUAL] categories ([${visualCategories.map(c => c.replace(/\s*-v\s*$/i, '').trim()).join(', ')}]), generate questions that match the category theme exactly.
      However, only generate questions about subjects that have a real Wikipedia page with a thumbnail image.

      Rules:
       - ALWAYS respect the category name and generate questions within that theme
       - For anime categories: use real anime characters that have Wikipedia pages
         GOOD: 'Naruto Uzumaki', 'Goku', 'Monkey D. Luffy', 'Light Yagami'
       - For anime categories with banned characters, draw from this expanded pool:
         Levi Ackerman, Itachi Uchiha, Killua Zoldyck, Rem, Mikasa Ackerman, 
         Vegeta, Saitama, Tanjiro Kamado, Zenitsu Agatsuma, Nezuko Kamado,
         Roronoa Zoro, Nami, Nico Robin, Trafalgar Law, Portgas D. Ace,
         Kakashi Hatake, Sasuke Uchiha, Hinata Hyuga, Rock Lee, Gaara,
         Ryuk, Near, Mello, L Lawliet, Misa Amane,
         Roy Mustang, Riza Hawkeye, Scar, Greed, Ling Yao,
         Spike Spiegel, Faye Valentine, Jet Black, Vicious,
         Yusuke Urameshi, Hiei, Kurama, Toguro
         Pick from these when original choices are banned.
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
        - The "question" field must be EXACTLY one of these strings, chosen randomly:
          "Guess the song." or "Name this track." or "What song is this?"
          The question field must contain ZERO information about the song title, artist, album, or any identifying details.
          CORRECT: "Guess the song."
          WRONG: "Guess the song: Bohemian Rhapsody" or "Name this track by Queen" or "What song is this? (hint: it's from the 80s)"
          The answer field contains the song title and artist. The question field contains nothing except the bare prompt string.
        - DO NOT set "searchTerm" (image) for audio questions. Only set "searchTermAudio" to the song title and artist.
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
          Each of the 5 questions must test a completely different aspect of the category

       4. Questions must NEVER be ambiguous — only one correct answer is possible

      DIFFICULTY SCALING RULES — strictly follow for every category:
       Global difficulty is set to: ${difficulty.toUpperCase()}
       Within that difficulty band, questions MUST still scale from easiest to hardest:
       ${pointValues.map((v, i) => {
         const labels = ['Extremely easy — anyone would know this', 'Easy — most people would know', 'Medium — requires some knowledge', 'Hard — requires strong knowledge', 'Expert level — enthusiasts/experts only', 'Very expert — deep niche knowledge', 'Master level — almost nobody knows this'];
         return `${v} points → ${labels[Math.min(i, labels.length - 1)]} (within ${difficulty} band)`;
       }).join('\n       ')}

       This means on HARD mode: even the 100pt question should be hard by normal standards.
       On EASY mode: even the 500pt question should be answerable by most people at a party.
       The difficulty band shifts the entire scale — it does not just affect the hardest question.

       ORDERING IS MANDATORY: index 0 = easiest within band, index ${questionsPerCategory - 1} = hardest within band.
       DO NOT shuffle. Verify before outputting.

      QUESTION QUALITY RULES — follow strictly:
       1. Every question MUST be phrased as a question ending with a '?'
          GOOD: 'What is the capital of France?'
          BAD: 'The capital of France', 'Name the capital of France'

       2. Every answer must be short and specific — 1 to 4 words maximum
          GOOD: 'Paris', 'Albert Einstein', 'The Eiffel Tower'
          BAD: 'It is Paris', 'The answer is Einstein'

       3. Questions must NEVER repeat within the same category
          Each of the 5 questions must test a completely different aspect of the category

       4. Questions must NEVER be ambiguous — only one correct answer is possible

       5. For AUDIO questions specifically: the question field must be a bare prompt with NO colons followed by content, NO artist names, NO song titles, NO album names, NO year hints, NO genre hints. Literally just "Guess the song." — nothing else.
`;

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
        temperature: 0.3,
        max_tokens: 5000
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
