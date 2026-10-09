import type { VercelRequest, VercelResponse } from '@vercel/node';

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

// Groq's Qwen 3.8 27B accepts reasoning_effort: none | default | low | medium | high.
// "low" gives the model a short scratchpad to calibrate difficulty and sanity-check
// facts, while staying fast. Set GROQ_REASONING_EFFORT=none for instruct mode.
const REASONING_EFFORT = process.env.GROQ_REASONING_EFFORT || 'low';

// Qwen's own recommended sampling (model card):
//   thinking mode : temperature 1.0, top_p 0.95
//   instruct mode : temperature 0.7, top_p 0.80
// The old value of 0.3 is the main reason the same "Naruto" came back every time.
const THINKING = REASONING_EFFORT !== 'none';
const TEMPERATURE = Number(process.env.GROQ_TEMPERATURE) || (THINKING ? 1.0 : 0.7);
const TOP_P = Number(process.env.GROQ_TOP_P) || (THINKING ? 0.95 : 0.8);

const MAX_COMPLETION_TOKENS = 12000; // reasoning tokens count against this too
const MAX_ATTEMPTS = 3;

type Difficulty = 'easy' | 'medium' | 'hard';
type Kind = 'text' | 'visual' | 'audio';

const POINT_VALUES: Record<number, number[]> = {
  3: [100, 300, 500],
  5: [100, 200, 300, 400, 500],
  7: [100, 200, 300, 400, 500, 600, 700],
};

/* -------------------------------------------------------------------------- */
/*  Absolute difficulty scale                                                 */
/*                                                                            */
/*  The old prompt asked for "easiest within the band", which a model can't   */
/*  calibrate. Instead every slot gets a fixed level on one 1-10 scale, and   */
/*  each difficulty setting just covers a different stretch of that scale.    */
/* -------------------------------------------------------------------------- */

// [level of the cheapest question, level of the most expensive question]
const LEVEL_RANGE: Record<Difficulty, [number, number]> = {
  easy: [1, 4],
  medium: [4, 7],
  hard: [6, 9], // hard 100 is already "committed fan", never a household name
};

const LEVEL_DESCRIPTION: Record<number, string> = {
  1: 'Universal: a household name any adult or older child knows without studying the topic.',
  2: 'Near-universal: almost everyone knows it, fan or not.',
  3: 'Casual: anyone with even mild interest in the topic knows it.',
  4: 'Familiar: a casual fan knows it, a non-fan probably does not.',
  5: 'Regular fan: follows the topic now and then; a normal mid-level pub-quiz question.',
  6: 'Committed fan: needs genuine interest. Beyond the headline names; the second or third thing that comes to mind, not the first.',
  7: 'Enthusiast: roughly 1 in 10 people who like the topic would know it.',
  8: 'Serious enthusiast: roughly 1 in 30. Specific details, supporting figures, secondary works.',
  9: 'Expert: roughly 1 in 100. Deep detail only specialists retain, but still verifiable and unambiguous.',
};

function levelFor(difficulty: Difficulty, index: number, count: number): number {
  const [lo, hi] = LEVEL_RANGE[difficulty];
  if (count <= 1) return lo;
  return Math.round(lo + ((hi - lo) * index) / (count - 1));
}

function subjectGuidance(kind: Kind, level: number): string {
  if (kind === 'visual') {
    if (level <= 2) return 'Subject: the lead or icon of a hugely famous series.';
    if (level <= 4) return 'Subject: a famous main-cast character.';
    if (level <= 6)
      return 'Subject: a well-known character who is NOT the lead of a mega-franchise. Fans name them instantly, casual viewers hesitate.';
    return 'Subject: a supporting or secondary character from a notable series. Only fans of that series would name them.';
  }
  if (kind === 'audio') {
    if (level <= 2) return 'Song: a worldwide mega-hit.';
    if (level <= 4) return 'Song: a famous hit most people have heard.';
    if (level <= 6)
      return "Song: well known to fans, but NOT the artist's signature hit.";
    return 'Song: a lesser hit or album track that mainly fans of the artist recognise (must still be on major streaming services).';
  }
  return '';
}

/* -------------------------------------------------------------------------- */
/*  Server-side subject pools (variety control for visual categories)         */
/*                                                                            */
/*  For anime, the server shuffles these pools and hands the model 3 options  */
/*  per slot, matched to the slot's difficulty. The model no longer decides   */
/*  "which character?" itself, which is what produced Naruto every time.      */
/*  Names are candidates only: the model must still confirm that the          */
/*  character has its own English Wikipedia article.                          */
/* -------------------------------------------------------------------------- */

const ANIME_POOL: string[][] = [
  // tier 0 - levels 1-2
  ['Naruto Uzumaki', 'Goku', 'Monkey D. Luffy', 'Light Yagami', 'Ash Ketchum', 'Astro Boy', 'Eren Yeager', 'Sailor Moon'],
  // tier 1 - levels 3-4
  ['Vegeta', 'Sasuke Uchiha', 'Kakashi Hatake', 'Roronoa Zoro', 'Tanjiro Kamado', 'Saitama', 'Edward Elric', 'Levi Ackerman', 'Mikasa Ackerman', 'Killua Zoldyck', 'Gon Freecss', 'Lelouch Lamperouge', 'Spike Spiegel', 'Natsu Dragneel', 'Izuku Midoriya', 'Inuyasha'],
  // tier 2 - levels 5-6
  ['Itachi Uchiha', 'Gaara', 'Rock Lee', 'Nami', 'Nico Robin', 'Portgas D. Ace', 'Trafalgar Law', 'Roy Mustang', 'Rem', 'Misa Amane', 'Ryuk', 'Nezuko Kamado', 'Zenitsu Agatsuma', 'Hinata Hyuga', 'Yusuke Urameshi', 'Sesshomaru', 'Kenshin Himura', 'Jotaro Kujo', 'Rukia Kuchiki', 'Ichigo Kurosaki', 'Sanji', 'Tony Tony Chopper', 'Shoto Todoroki', 'Katsuki Bakugo', 'Asuka Langley Soryu', 'Shinji Ikari', 'Rei Ayanami'],
  // tier 3 - levels 7+
  ['Kisame Hoshigaki', 'Jiraiya', 'Orochimaru', 'Might Guy', 'Shikamaru Nara', 'Hisoka Morow', 'Kurapika', 'Meruem', 'Alphonse Elric', 'Riza Hawkeye', 'Jet Black', 'Faye Valentine', 'Hiei', 'Kurama', 'Mello', 'Near', 'Kaworu Nagisa', 'Misato Katsuragi', 'Dio Brando', 'Giorno Giovanna', 'Mugen', 'Kenpachi Zaraki', 'Sosuke Aizen', 'Boa Hancock', 'Dracule Mihawk', 'Franky', 'Brook'],
];

function poolFor(key: string, kind: Kind): string[][] | null {
  if (kind === 'visual' && /anime|manga/.test(key)) return ANIME_POOL;
  return null;
}

function tierForLevel(level: number): number {
  if (level <= 2) return 0;
  if (level <= 4) return 1;
  if (level <= 6) return 2;
  return 3;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

interface CategorySpec {
  name: string; // without the -v / -a suffix
  key: string; // lower-cased name, matches the keys of `exclusions`
  kind: Kind;
}

function parseCategory(raw: string): CategorySpec {
  const trimmed = raw.trim();
  const m = trimmed.match(/^(.*\S)\s+-([va])$/i);
  const name = m ? m[1].trim() : trimmed;
  const kind: Kind = m ? (m[2].toLowerCase() === 'v' ? 'visual' : 'audio') : 'text';
  return { name, key: name.toLowerCase(), kind };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

function isBanned(value: string, banned: string[]): boolean {
  const v = norm(value);
  if (!v) return false;
  return banned.some((b) => {
    const n = norm(b);
    if (!n) return false;
    if (v === n) return true;
    return n.length >= 4 && v.length >= 4 && (v.includes(n) || n.includes(v));
  });
}

const VISUAL_PROMPTS = ['Who is this?', 'Who is this character?'];
const AUDIO_PROMPTS = ['Guess the song.', 'Name this track.', 'What song is this?'];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/* -------------------------------------------------------------------------- */
/*  Prompt                                                                    */
/* -------------------------------------------------------------------------- */

// Static part first, so providers that cache prompt prefixes can reuse it.
const SYSTEM_PROMPT = `You write questions for a Jeopardy-style trivia game. You reply with JSON that matches the supplied schema and nothing else.

DIFFICULTY IS ABSOLUTE
Every question slot is assigned a fixed difficulty level from 1 to 10. The scale means the same thing in every category and every game:
${Object.entries(LEVEL_DESCRIPTION)
  .map(([l, d]) => `  ${l} = ${d}`)
  .join('\n')}

Rules for hitting the assigned level:
- Difficulty comes from how much knowledge the question needs, never from vague wording or trick phrasing.
- The first answers that come to mind in a category are the famous ones. For level 5 and above, discard the first three ideas you think of, then pick something less obvious.
- The single most famous answer in a category is never allowed above level 2.
- A level-6 question is still clearly harder than a level-4 question from an "easy" game. Do not drift easier because an answer feels familiar to you.
- For every question, write "audience": who realistically knows this answer, in 12 words or fewer. If that audience is larger or smaller than the assigned level, replace the question before you output it.
- Echo the assigned level in "level".
- Within a category, each question covers a different aspect of the category. Never reuse a subject.

ACCURACY
- Use only facts you are certain of. When a niche fact feels shaky, choose a different niche fact. A wrong answer is worse than an easier question.
- Each question has exactly one correct answer. Add whatever detail the question needs (era, series, country, medium) to rule out alternatives.

FORMAT
- Text questions are complete questions ending in "?".
- Answers are short: 1 to 4 words, no sentence. Visual answers are the character's common name; audio answers are "Song Title - Artist".
- Fun, casual tone.
- Examples named in this prompt are never to be reused as answers unless explicitly offered as a candidate for a slot.

VISUAL categories (the player sees a picture and names the subject)
- "searchTerm" is the exact English Wikipedia article title of the subject. The subject MUST have its own article with a lead image.
- "answer" is the subject's common name and must match the subject of searchTerm.
- "question" is "Who is this?".
- When a slot lists candidates, choose exactly one of them. If none has its own Wikipedia article, choose another subject of the same fame level.
- "searchTermAudio" is null.

AUDIO categories (the player hears a clip and names the song)
- "question" is exactly "Guess the song." and contains no hint about the song, artist, album, year or genre.
- "searchTermAudio" is "Song Title Artist". "answer" is "Song Title - Artist". "searchTerm" is null.

TEXT categories
- "searchTerm" and "searchTermAudio" are null.`;

interface Slot {
  value: number;
  level: number;
  candidates: string[];
}

function buildUserPrompt(
  specs: CategorySpec[],
  slots: Slot[][],
  banned: Record<string, string[]>,
  difficulty: Difficulty,
  feedback: string[]
): string {
  const blocks = specs.map((spec, ci) => {
    const kindLabel =
      spec.kind === 'visual'
        ? 'VISUAL (guess from an image)'
        : spec.kind === 'audio'
        ? 'AUDIO (guess the song)'
        : 'TEXT';
    const lines = slots[ci].map((s) => {
      const parts = [`  - ${s.value} pts | level ${s.level}/10 | ${LEVEL_DESCRIPTION[s.level]}`];
      const g = subjectGuidance(spec.kind, s.level);
      if (g) parts.push(`    ${g}`);
      if (s.candidates.length) parts.push(`    Candidates (choose exactly one): ${s.candidates.join(' | ')}`);
      return parts.join('\n');
    });
    const b = banned[spec.key] ?? [];
    const bannedLine = b.length
      ? `\n  BANNED answers (used in earlier boards, do not use or paraphrase): ${b.join(', ')}`
      : '';
    return `${ci + 1}. "${spec.name}" - ${kindLabel}\n${lines.join('\n')}${bannedLine}`;
  });

  const retry = feedback.length
    ? `\n\nYour previous attempt was rejected for these reasons. Fix every one of them:\n${feedback
        .map((f) => `- ${f}`)
        .join('\n')}`
    : '';

  return `Build a board for a game set to ${difficulty.toUpperCase()} difficulty.
Output the categories in exactly the order below, using the exact category names, with one question per slot in the order listed.

${blocks.join('\n\n')}${retry}`;
}

/* -------------------------------------------------------------------------- */
/*  Output schema (Groq strict structured outputs)                            */
/*  Strict mode requires: every property in `required`, additionalProperties  */
/*  false, optional values expressed as ["string","null"], object at the root.*/
/*  Property order matters: the model fills them in this order, so the        */
/*  calibration fields come before the question itself.                       */
/* -------------------------------------------------------------------------- */

const BOARD_SCHEMA = {
  type: 'object',
  properties: {
    board: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                level: { type: 'integer' },
                audience: { type: 'string' },
                question: { type: 'string' },
                answer: { type: 'string' },
                searchTerm: { type: ['string', 'null'] },
                searchTermAudio: { type: ['string', 'null'] },
              },
              required: ['level', 'audience', 'question', 'answer', 'searchTerm', 'searchTermAudio'],
              additionalProperties: false,
            },
          },
        },
        required: ['category', 'questions'],
        additionalProperties: false,
      },
    },
  },
  required: ['board'],
  additionalProperties: false,
};

/* -------------------------------------------------------------------------- */
/*  Validation + normalisation                                                */
/* -------------------------------------------------------------------------- */

interface BoardQuestion {
  value: number;
  question: string;
  answer: string;
  status: 'hidden';
  searchTerm?: string;
  searchTermAudio?: string;
}
interface BoardCategory {
  category: string;
  questions: BoardQuestion[];
}
interface Validated {
  board: BoardCategory[];
  hard: string[]; // structural problems: the board is unusable
  soft: string[]; // quality problems: usable, but worth a retry
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function validate(
  text: string,
  specs: CategorySpec[],
  slots: Slot[][],
  banned: Record<string, string[]>
): Validated {
  const out: Validated = { board: [], hard: [], soft: [] };

  let parsed: any;
  try {
    const cleaned = text
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/```json\n?|```/g, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    out.hard.push('Output was not valid JSON.');
    return out;
  }

  const raw: any[] = Array.isArray(parsed) ? parsed : parsed?.board;
  if (!Array.isArray(raw) || raw.length !== specs.length) {
    out.hard.push(`Expected exactly ${specs.length} categories.`);
    return out;
  }

  specs.forEach((spec, ci) => {
    const rawQs = raw[ci]?.questions;
    const expected = slots[ci].length;
    if (!Array.isArray(rawQs) || rawQs.length !== expected) {
      out.hard.push(`Category "${spec.name}" must have exactly ${expected} questions.`);
      return;
    }

    const bannedList = banned[spec.key] ?? [];
    const seenAnswers = new Set<string>();
    const questions: BoardQuestion[] = [];

    rawQs.forEach((q: any, qi: number) => {
      const slot = slots[ci][qi];
      const tag = `"${spec.name}" ${slot.value}pts`;
      let question = str(q?.question);
      const answer = str(q?.answer);
      const searchTerm = str(q?.searchTerm);
      let searchTermAudio = str(q?.searchTermAudio);

      if (!question || !answer) {
        out.hard.push(`${tag}: missing question or answer.`);
        return;
      }

      const item: BoardQuestion = { value: slot.value, question, answer, status: 'hidden' };

      if (spec.kind === 'visual') {
        if (!searchTerm) out.hard.push(`${tag}: visual question needs a Wikipedia searchTerm.`);
        item.searchTerm = searchTerm;
        item.question = pick(VISUAL_PROMPTS); // enforced server-side, never leaks the subject
      } else if (spec.kind === 'audio') {
        if (!searchTermAudio) searchTermAudio = answer;
        item.searchTermAudio = searchTermAudio;
        item.question = pick(AUDIO_PROMPTS); // enforced server-side, never leaks the song
      } else {
        question = question.replace(/[\s.!]+$/, '');
        item.question = question.endsWith('?') ? question : `${question}?`;
        if (answer.split(/\s+/).length > 8) out.soft.push(`${tag}: answer is too long, keep it to 1-4 words.`);
      }

      if (Number(q?.level) !== slot.level)
        out.soft.push(`${tag}: must be written at level ${slot.level}, not ${q?.level}.`);

      const key = norm(answer);
      if (seenAnswers.has(key)) out.soft.push(`${tag}: duplicate answer "${answer}" in this category.`);
      seenAnswers.add(key);

      if (isBanned(answer, bannedList) || (searchTerm && isBanned(searchTerm, bannedList)))
        out.soft.push(`${tag}: "${answer}" is a banned answer. Choose a different subject.`);

      questions.push(item);
    });

    out.board.push({ category: spec.name, questions });
  });

  return out;
}

/* -------------------------------------------------------------------------- */
/*  Groq call                                                                 */
/* -------------------------------------------------------------------------- */

type GroqResult =
  | { ok: true; text: string; truncated: boolean }
  | { ok: false; status: number; message: string };

async function callGroq(apiKey: string, user: string, strict: boolean): Promise<GroqResult> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
      temperature: TEMPERATURE,
      top_p: TOP_P,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      reasoning_effort: REASONING_EFFORT,
      // JSON / structured-output modes do not support "raw" reasoning, so hide it.
      reasoning_format: 'hidden',
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'jeopardy_board', strict, schema: BOARD_SCHEMA },
      },
    }),
  });

  if (!response.ok) {
    const err: any = await response.json().catch(() => ({}));
    return { ok: false, status: response.status, message: err?.error?.message || response.statusText };
  }

  const data: any = await response.json();
  const choice = data.choices?.[0];
  const text = choice?.message?.content;
  if (!text) return { ok: false, status: 500, message: 'No content returned from Groq' };
  return { ok: true, text, truncated: choice?.finish_reason === 'length' };
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { categories, settings, exclusions = {} } = req.body ?? {};
  if (
    !Array.isArray(categories) ||
    categories.length === 0 ||
    !categories.every((c) => typeof c === 'string' && c.trim())
  ) {
    return res.status(400).json({ error: 'Missing or invalid categories' });
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const difficulty: Difficulty = ['easy', 'medium', 'hard'].includes(settings?.difficulty)
    ? settings.difficulty
    : 'medium';
  const perCategory: number = POINT_VALUES[settings?.questionsPerCategory]
    ? settings.questionsPerCategory
    : 5;
  const pointValues = POINT_VALUES[perCategory];

  const specs = (categories as string[]).map(parseCategory);

  // Banned answers, keyed by lower-cased category name, capped to the last 25.
  const banned: Record<string, string[]> = {};
  for (const [cat, topics] of Object.entries(exclusions as Record<string, unknown>)) {
    if (Array.isArray(topics) && topics.length)
      banned[cat.trim().toLowerCase()] = topics.filter((t) => typeof t === 'string').slice(-25);
  }

  // Slots: fixed point value + fixed absolute level (+ shuffled candidates where a pool exists).
  const slots: Slot[][] = specs.map((spec) => {
    const pool = poolFor(spec.key, spec.kind);
    const used = new Set<string>();
    const bannedList = banned[spec.key] ?? [];
    return pointValues.map((value, i) => {
      const level = levelFor(difficulty, i, pointValues.length);
      let candidates: string[] = [];
      if (pool) {
        candidates = shuffle(pool[tierForLevel(level)])
          .filter((name) => !used.has(name) && !isBanned(name, bannedList))
          .slice(0, 3);
        candidates.forEach((c) => used.add(c));
      }
      return { value, level, candidates };
    });
  });

  let feedback: string[] = [];
  let strict = true;
  let best: Validated | null = null;
  let lastError = 'AI returned an invalid board';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const userPrompt = buildUserPrompt(specs, slots, banned, difficulty, feedback);

    let result: GroqResult;
    try {
      result = await callGroq(apiKey, userPrompt, strict);
    } catch (error) {
      console.error('Groq request failed:', error);
      lastError = 'Could not reach Groq';
      continue;
    }

    if (!result.ok) {
      // Strict schema rejected by the API: fall back to best-effort mode once.
      if (result.status === 400 && strict && /schema/i.test(result.message)) {
        console.warn('Strict schema rejected, retrying with strict=false:', result.message);
        strict = false;
        attempt--;
        continue;
      }
      // Rate limit / auth / quota errors will not fix themselves on retry.
      if ([401, 403, 429].includes(result.status))
        return res.status(result.status).json({ error: `Groq API Error: ${result.message}` });
      lastError = `Groq API Error: ${result.message}`;
      continue;
    }

    const checked = validate(result.text, specs, slots, banned);
    if (result.truncated) checked.hard.push('Output was cut off before the JSON finished.');

    if (!best || checked.hard.length < best.hard.length ||
        (checked.hard.length === best.hard.length && checked.soft.length < best.soft.length)) {
      best = checked;
    }

    if (checked.hard.length === 0 && checked.soft.length === 0) break;

    feedback = [...checked.hard, ...checked.soft].slice(0, 12);
    console.warn(`Attempt ${attempt} rejected:`, feedback);
  }

  if (best && best.hard.length === 0) {
    if (best.soft.length) console.warn('Returning board with unresolved quality issues:', best.soft);
    return res.status(200).json(best.board);
  }

  console.error('Board generation failed:', best?.hard ?? lastError);
  return res.status(500).json({ error: best ? 'AI returned invalid JSON structure' : lastError });
}
