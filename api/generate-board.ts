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
const THINKING = REASONING_EFFORT !== 'none';
const TEMPERATURE = Number(process.env.GROQ_TEMPERATURE) || (THINKING ? 1.0 : 0.7);
const TOP_P = Number(process.env.GROQ_TOP_P) || (THINKING ? 0.95 : 0.8);

const MAX_COMPLETION_TOKENS = 12000; // reasoning tokens count against this too
const MAX_ATTEMPTS = 3;

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Kind = 'text' | 'visual' | 'audio';

export const POINT_VALUES: Record<number, number[]> = {
  3: [100, 300, 500],
  5: [100, 200, 300, 400, 500],
  7: [100, 200, 300, 400, 500, 600, 700],
};

/* -------------------------------------------------------------------------- */
/*  Absolute difficulty scale                                                 */
/* -------------------------------------------------------------------------- */

export const LEVEL_RANGE: Record<Difficulty, [number, number]> = {
  easy: [1, 4],
  medium: [4, 7],
  hard: [6, 9], // hard 100 is already "committed fan", never a household name
};

export const LEVEL_DESCRIPTION: Record<number, string> = {
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

export function levelFor(difficulty: Difficulty, index: number, count: number): number {
  const [lo, hi] = LEVEL_RANGE[difficulty];
  if (count <= 1) return lo;
  return Math.round(lo + ((hi - lo) * index) / (count - 1));
}

export function isLocationMode(spec: CategorySpec): boolean {
  return spec.kind === 'visual' && /movie|film|cinema|tv|show|series/i.test(spec.name);
}

export function subjectGuidance(spec: CategorySpec, level: number): string {
  if (spec.kind === 'visual') {
    if (isLocationMode(spec)) {
      if (level <= 2)
        return 'Filming location: a world-famous, instantly recognisable setting of a massive blockbuster/franchise (e.g. Alnwick Castle).';
      if (level <= 4)
        return 'Filming location: a well-known real-world landmark closely associated with one famous movie or show (e.g. Dubrovnik for Game of Thrones).';
      if (level <= 6)
        return 'Filming location: a notable real-world site featured prominently in a well-known film or TV series.';
      return 'Filming location: a real location recognisable to dedicated fans of the film or TV series.';
    }
    if (level <= 2) return 'Subject: the lead or icon of a hugely famous series.';
    if (level <= 4) return 'Subject: a famous main-cast character.';
    if (level <= 6)
      return 'Subject: a well-known character who is NOT the lead of a mega-franchise. Fans name them instantly, casual viewers hesitate.';
    return 'Subject: a supporting or secondary character from a notable series. Only fans of that series would name them.';
  }
  if (spec.kind === 'audio') {
    if (level <= 2) return 'Song: a worldwide mega-hit (popularityRank 1-3).';
    if (level <= 4) return 'Song: a famous hit most people have heard (popularityRank <= 5).';
    if (level <= 5)
      return "Song: well known to fans, but NOT the artist's signature hit.";
    return 'Song: album tracks, B-sides, deep cuts or collaborations; never a top-5 song. The clip must be recognisable to a real fan of the artist, not obscure to the point of unfair.';
  }
  return '';
}

/* -------------------------------------------------------------------------- */
/*  Server-side subject pools                                                 */
/* -------------------------------------------------------------------------- */

export const ANIME_POOL: string[][] = [
  // tier 0 - levels 1-2
  ['Naruto Uzumaki', 'Goku', 'Monkey D. Luffy', 'Light Yagami', 'Ash Ketchum', 'Astro Boy', 'Eren Yeager', 'Sailor Moon'],
  // tier 1 - levels 3-4
  ['Vegeta', 'Sasuke Uchiha', 'Kakashi Hatake', 'Roronoa Zoro', 'Tanjiro Kamado', 'Saitama', 'Edward Elric', 'Levi Ackerman', 'Mikasa Ackerman', 'Killua Zoldyck', 'Gon Freecss', 'Lelouch Lamperouge', 'Spike Spiegel', 'Natsu Dragneel', 'Izuku Midoriya', 'Inuyasha'],
  // tier 2 - levels 5-6
  ['Itachi Uchiha', 'Gaara', 'Rock Lee', 'Nami', 'Nico Robin', 'Portgas D. Ace', 'Trafalgar Law', 'Roy Mustang', 'Rem', 'Misa Amane', 'Ryuk', 'Nezuko Kamado', 'Zenitsu Agatsuma', 'Hinata Hyuga', 'Yusuke Urameshi', 'Sesshomaru', 'Kenshin Himura', 'Jotaro Kujo', 'Rukia Kuchiki', 'Ichigo Kurosaki', 'Sanji', 'Tony Tony Chopper', 'Shoto Todoroki', 'Katsuki Bakugo', 'Asuka Langley Soryu', 'Shinji Ikari', 'Rei Ayanami'],
  // tier 3 - levels 7+
  ['Kisame Hoshigaki', 'Jiraiya', 'Orochimaru', 'Might Guy', 'Shikamaru Nara', 'Hisoka Morow', 'Kurapika', 'Meruem', 'Alphonse Elric', 'Riza Hawkeye', 'Jet Black', 'Faye Valentine', 'Hiei', 'Kurama', 'Mello', 'Near', 'Kaworu Nagisa', 'Misato Katsuragi', 'Dio Brando', 'Giorno Giovanna', 'Mugen', 'Kenpachi Zaraki', 'Sosuke Aizen', 'Boa Hancock', 'Dracule Mihawk', 'Franky', 'Brook'],
];

export interface GamePoolEntry {
  name: string;
  source: string;
}

export const GAME_POOL: GamePoolEntry[][] = [
  // tier 0 - levels 1-2
  [
    { name: 'Mario', source: 'Super Mario' },
    { name: 'Sonic the Hedgehog', source: 'Sonic the Hedgehog' },
    { name: 'Pac-Man', source: 'Pac-Man' },
    { name: 'Pikachu', source: 'Pokémon' },
    { name: 'Link', source: 'The Legend of Zelda' },
    { name: 'Master Chief', source: 'Halo' },
    { name: 'Lara Croft', source: 'Tomb Raider' },
    { name: 'Kratos', source: 'God of War' },
  ],
  // tier 1 - levels 3-4
  [
    { name: 'Geralt of Rivia', source: 'The Witcher' },
    { name: 'Cloud Strife', source: 'Final Fantasy VII' },
    { name: 'Arthur Morgan', source: 'Red Dead Redemption 2' },
    { name: 'Nathan Drake', source: 'Uncharted' },
    { name: 'Solid Snake', source: 'Metal Gear Solid' },
    { name: 'Gordon Freeman', source: 'Half-Life' },
    { name: 'Ellie', source: 'The Last of Us' },
    { name: 'Joel Miller', source: 'The Last of Us' },
    { name: 'Sephiroth', source: 'Final Fantasy VII' },
    { name: 'Samus Aran', source: 'Metroid' },
    { name: 'Donkey Kong', source: 'Donkey Kong' },
    { name: 'Leon S. Kennedy', source: 'Resident Evil' },
  ],
  // tier 2 - levels 5-6
  [
    { name: 'Dante', source: 'Devil May Cry' },
    { name: 'Trevor Philips', source: 'Grand Theft Auto V' },
    { name: 'Ezio Auditore', source: "Assassin's Creed" },
    { name: 'Doom Slayer', source: 'Doom' },
    { name: 'Commander Shepard', source: 'Mass Effect' },
    { name: 'Aloy', source: 'Horizon Zero Dawn' },
    { name: 'Agent 47', source: 'Hitman' },
    { name: 'GLaDOS', source: 'Portal' },
    { name: 'Sora', source: 'Kingdom Hearts' },
    { name: 'Marcus Fenix', source: 'Gears of War' },
    { name: 'Jin Sakai', source: 'Ghost of Tsushima' },
    { name: 'Claire Redfield', source: 'Resident Evil' },
  ],
  // tier 3 - levels 7+
  [
    { name: 'Vaas Montenegro', source: 'Far Cry 3' },
    { name: 'Pyramid Head', source: 'Silent Hill 2' },
    { name: 'Booker DeWitt', source: 'BioShock Infinite' },
    { name: 'Corvo Attano', source: 'Dishonored' },
    { name: 'Senua', source: 'Hellblade' },
    { name: 'Solaire of Astora', source: 'Dark Souls' },
    { name: 'Lady Maria', source: 'Bloodborne' },
    { name: 'G-Man', source: 'Half-Life' },
    { name: 'Handsome Jack', source: 'Borderlands 2' },
    { name: 'Cole MacGrath', source: 'Infamous' },
    { name: 'Arthas Menethil', source: 'Warcraft' },
    { name: 'Cayde-6', source: 'Destiny' },
  ],
];

export function poolFor(key: string, kind: Kind): (string | GamePoolEntry)[][] | null {
  if (kind === 'visual') {
    if (/anime|manga/.test(key)) return ANIME_POOL;
    if (/game|gaming|video\s*game/.test(key)) return GAME_POOL;
  }
  return null;
}

export function tierForLevel(level: number): number {
  if (level <= 2) return 0;
  if (level <= 4) return 1;
  if (level <= 6) return 2;
  return 3;
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* -------------------------------------------------------------------------- */
/*  Helpers & Normalisation                                                   */
/* -------------------------------------------------------------------------- */

export interface CategorySpec {
  name: string; // without the -v / -a suffix
  key: string; // lower-cased name, matches the keys of `exclusions`
  kind: Kind;
}

export function parseCategory(raw: string): CategorySpec {
  const trimmed = raw.trim();
  const m = trimmed.match(/^(.*\S)\s+-([va])$/i);
  const name = m ? m[1].trim() : trimmed;
  const kind: Kind = m ? (m[2].toLowerCase() === 'v' ? 'visual' : 'audio') : 'text';
  return { name, key: name.toLowerCase(), kind };
}

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export function isBanned(value: string, banned: string[]): boolean {
  const v = norm(value);
  if (!v) return false;
  return banned.some((b) => {
    const n = norm(b);
    if (!n) return false;
    if (v === n) return true;
    return n.length >= 4 && v.length >= 4 && (v.includes(n) || n.includes(v));
  });
}

export const VISUAL_PROMPTS = ['Who is this?', 'Who is this character?'];
export const AUDIO_PROMPTS = ['Guess the song.', 'Name this track.', 'What song is this?'];
export const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/* -------------------------------------------------------------------------- */
/*  Prompt                                                                    */
/* -------------------------------------------------------------------------- */

export const SYSTEM_PROMPT = `You write questions for a Jeopardy-style trivia game. You reply with JSON that matches the supplied schema and nothing else.

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
- Choose a single character, never a duo, team or pair.
- "searchTerm" is the exact English Wikipedia article title of the subject. The subject MUST have its own article with a lead image.
- "answer" is the subject's common name and must match the subject of searchTerm.
- "source" is the game, series, film or franchise the subject belongs to (e.g. "God of War", "Naruto").
- "question" is "Who is this?".
- When a slot lists candidates, choose exactly one of them. If none has its own Wikipedia article, choose another subject of the same fame level.
- "popularityRank" is null. "searchTermAudio" is null.

LOCATION MODE (visual categories where the category name contains movie, film, cinema, tv, show, or series)
- The image is a real, famous filming location or iconic setting, such as Alnwick Castle or Dubrovnik.
- The question is "Which movie or show features this location?".
- The answer is the movie or show title (add the year only if a remake makes it ambiguous).
- "searchTerm" is the exact English Wikipedia article title of the real location.
- "source" is the title of the movie or show (same as answer).
- The location must be strongly tied to one title. Reject locations with many famous productions.
- Level scales with how famous the title and location are.
- NEVER choose a location whose name gives the title away (e.g. never "Hogwarts").
- "popularityRank" is null. "searchTermAudio" is null.

AUDIO categories (the player hears a clip and names the song)
- "question" is exactly "Guess the song." and contains no hint about the song, artist, album, year or genre.
- "searchTermAudio" is "Song Title Artist". "answer" is "Song Title - Artist". "searchTerm" is null.
- "source" is the artist or band name.
- "popularityRank" is an integer representing the song's approximate rank among that artist's tracks by popularity (1 = biggest hit).
  - Level 1-4: popularityRank 1 to 5 (top hits).
  - Level 6: popularityRank >= 8 (album tracks, B-sides, deep cuts or collaborations; never a top-5 song). Must be recognisable to a real fan of the artist, not obscure to the point of unfair.
  - Level 7: popularityRank >= 12.
  - Level 8-9: popularityRank >= 15.

TEXT categories
- "searchTerm", "searchTermAudio", "source", and "popularityRank" are null.`;

export interface Slot {
  value: number;
  level: number;
  candidates: string[];
}

export function buildUserPrompt(
  specs: CategorySpec[],
  slots: Slot[][],
  banned: Record<string, string[]>,
  difficulty: Difficulty,
  feedback: string[]
): string {
  const blocks = specs.map((spec, ci) => {
    const isLoc = isLocationMode(spec);
    const kindLabel =
      spec.kind === 'visual'
        ? isLoc
          ? 'VISUAL (LOCATION MODE: identify movie/show from real filming location)'
          : 'VISUAL (guess character/subject from an image)'
        : spec.kind === 'audio'
        ? 'AUDIO (guess the song from a clip)'
        : 'TEXT';
    const lines = slots[ci].map((s) => {
      const parts = [`  - ${s.value} pts | level ${s.level}/10 | ${LEVEL_DESCRIPTION[s.level]}`];
      const g = subjectGuidance(spec, s.level);
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
/* -------------------------------------------------------------------------- */

const QUESTION_SCHEMA_PROPERTIES = {
  level: { type: 'integer' },
  audience: { type: 'string' },
  popularityRank: { type: ['integer', 'null'] },
  question: { type: 'string' },
  answer: { type: 'string' },
  source: { type: ['string', 'null'] },
  searchTerm: { type: ['string', 'null'] },
  searchTermAudio: { type: ['string', 'null'] },
};

const QUESTION_SCHEMA_REQUIRED = [
  'level',
  'audience',
  'popularityRank',
  'question',
  'answer',
  'source',
  'searchTerm',
  'searchTermAudio',
];

export const BOARD_SCHEMA = {
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
              properties: QUESTION_SCHEMA_PROPERTIES,
              required: QUESTION_SCHEMA_REQUIRED,
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

const SINGLE_SLOT_SCHEMA = {
  type: 'object',
  properties: {
    slot: {
      type: 'object',
      properties: QUESTION_SCHEMA_PROPERTIES,
      required: QUESTION_SCHEMA_REQUIRED,
      additionalProperties: false,
    },
  },
  required: ['slot'],
  additionalProperties: false,
};

/* -------------------------------------------------------------------------- */
/*  Validation + normalisation                                                */
/* -------------------------------------------------------------------------- */

export interface BoardQuestion {
  value: number;
  question: string;
  answer: string;
  status: 'hidden';
  searchTerm?: string;
  searchTermAudio?: string;
  source?: string | null;
  popularityRank?: number | null;
  level?: number;
}

export interface BoardCategory {
  category: string;
  questions: BoardQuestion[];
}

export interface Validated {
  board: BoardCategory[];
  hard: string[]; // structural problems: the board is unusable
  soft: string[]; // quality problems: usable, but worth a retry
}

export function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function validate(
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
      const source = typeof q?.source === 'string' ? q.source.trim() : null;
      const popularityRank = typeof q?.popularityRank === 'number' ? q.popularityRank : null;

      if (!question || !answer) {
        out.hard.push(`${tag}: missing question or answer.`);
        return;
      }

      const item: BoardQuestion = {
        value: slot.value,
        question,
        answer,
        status: 'hidden',
        source: source ?? null,
        popularityRank,
        level: slot.level,
      };

      if (spec.kind === 'visual') {
        if (!searchTerm) {
          out.hard.push(`${tag}: visual question needs a Wikipedia searchTerm.`);
        }
        item.searchTerm = searchTerm;

        if (isLocationMode(spec)) {
          // Server-side enforce the fixed question text for location mode
          item.question = 'Which movie or show features this location?';
          item.source = source || answer;

          // Never choose a location whose name gives the title away
          if (searchTerm && answer) {
            const nTerm = norm(searchTerm);
            const nAns = norm(answer);
            if (nTerm.length >= 3 && nAns.length >= 3 && (nTerm.includes(nAns) || nAns.includes(nTerm))) {
              out.soft.push(
                `${tag}: location name "${searchTerm}" gives away the answer "${answer}". Choose an iconic filming location whose name does not contain the answer.`
              );
            }
          }
        } else {
          item.question = pick(VISUAL_PROMPTS); // enforced server-side, never leaks the subject
        }
      } else if (spec.kind === 'audio') {
        if (!searchTermAudio) searchTermAudio = answer;
        item.searchTermAudio = searchTermAudio;
        item.question = pick(AUDIO_PROMPTS); // enforced server-side, never leaks the song

        // Soft checks for popularityRank
        if (popularityRank !== null) {
          if (slot.level <= 4 && popularityRank > 5) {
            out.soft.push(
              `${tag}: level ${slot.level} audio needs popularityRank <= 5, but got ${popularityRank}.`
            );
          } else if (slot.level === 6 && popularityRank < 8) {
            out.soft.push(
              `${tag}: level 6 audio needs popularityRank >= 8, but got ${popularityRank}. Use album tracks, B-sides, deep cuts or collaborations; never a top-5 song.`
            );
          } else if (slot.level === 7 && popularityRank < 12) {
            out.soft.push(
              `${tag}: level 7 audio needs popularityRank >= 12, but got ${popularityRank}.`
            );
          } else if (slot.level >= 8 && popularityRank < 15) {
            out.soft.push(
              `${tag}: level ${slot.level} audio needs popularityRank >= 15, but got ${popularityRank}.`
            );
          }
        } else {
          out.soft.push(`${tag}: audio question missing popularityRank.`);
        }
      } else {
        question = question.replace(/[\s.!]+$/, '');
        item.question = question.endsWith('?') ? question : `${question}?`;
        if (answer.split(/\s+/).length > 8) {
          out.soft.push(`${tag}: answer is too long, keep it to 1-4 words.`);
        }
      }

      if (Number(q?.level) !== slot.level) {
        out.soft.push(`${tag}: must be written at level ${slot.level}, not ${q?.level}.`);
      }

      const key = norm(answer);
      if (seenAnswers.has(key)) {
        out.soft.push(`${tag}: duplicate answer "${answer}" in this category.`);
      }
      seenAnswers.add(key);

      if (isBanned(answer, bannedList) || (searchTerm && isBanned(searchTerm, bannedList))) {
        out.soft.push(`${tag}: "${answer}" is a banned answer. Choose a different subject.`);
      }

      questions.push(item);
    });

    out.board.push({ category: spec.name, questions });
  });

  return out;
}

/* -------------------------------------------------------------------------- */
/*  Media Lookup & Verification                                               */
/* -------------------------------------------------------------------------- */

export const FICTIONAL_KEYWORDS = ['fictional', 'character', 'video game', 'protagonist', 'antagonist'];
export const REAL_PERSON_KEYWORDS = ['actor', 'actress', 'singer', 'footballer', 'politician', 'born'];
export const GROUP_SHOT_PATTERNS = ['group', 'cast', 'team', 'characters', 'collage'];

// In-memory cache for lookups for the lifetime of the serverless function
const lookupCache = new Map<string, { ok: boolean; url?: string; reason?: string }>();

export function buildWikipediaSearchQuery(answer: string, source?: string | null): string {
  const cleanAns = answer.trim();
  const cleanSrc = (source || '').trim();
  return cleanSrc ? `${cleanAns} ${cleanSrc}` : cleanAns;
}

export function checkWikipediaSubject(
  page: {
    title?: string;
    description?: string;
    extract?: string;
    thumbnail?: { source?: string; width?: number; height?: number };
  },
  source?: string | null
): { ok: boolean; reason?: string } {
  const desc = (page.description || '').toLowerCase();
  const extract = (page.extract || '').toLowerCase();
  const text = `${desc} ${extract}`;

  // Check negative keywords (real person)
  for (const neg of REAL_PERSON_KEYWORDS) {
    if (neg === 'born') {
      if (/\bborn\b/i.test(text)) {
        return { ok: false, reason: `Contains real person indicator: "${neg}"` };
      }
    } else if (text.includes(neg)) {
      return { ok: false, reason: `Contains real person indicator: "${neg}"` };
    }
  }

  // Check positive keywords or source title
  const sourceLower = (source || '').toLowerCase().trim();
  const hasSource = sourceLower && text.includes(sourceLower);
  const hasFictional = FICTIONAL_KEYWORDS.some((kw) => text.includes(kw));

  if (!hasFictional && !hasSource) {
    return { ok: false, reason: 'Does not contain fictional/character indicator or source title' };
  }

  // Check thumbnail
  if (!page.thumbnail?.source) {
    return { ok: false, reason: 'No thumbnail image found' };
  }

  // Check aspect ratio (group shot: width/height > 1.6)
  const w = page.thumbnail.width;
  const h = page.thumbnail.height;
  if (w && h && w / h > 1.6) {
    return { ok: false, reason: `Image width/height ratio ${(w / h).toFixed(2)} > 1.6 (likely group shot)` };
  }

  // Check filename for group shot
  const filename = (page.thumbnail.source || '').toLowerCase();
  if (GROUP_SHOT_PATTERNS.some((pat) => filename.includes(pat))) {
    return { ok: false, reason: 'Image filename indicates group/cast/team shot' };
  }

  return { ok: true };
}

export async function lookupWikipediaCharacterImage(
  answer: string,
  source: string | null
): Promise<{ ok: boolean; url?: string; pageTitle?: string; reason?: string }> {
  const cacheKey = `wiki:${norm(answer)}:::${norm(source || '')}`;
  if (lookupCache.has(cacheKey)) {
    return lookupCache.get(cacheKey)!;
  }

  // Query 1: "{answer} {source}"
  const query1 = buildWikipediaSearchQuery(answer, source);
  const url1 = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query1
  )}&gsrlimit=5&prop=pageimages|description|extracts&exintro=1&explaintext=1&pithumbsize=1000&format=json&origin=*`;

  try {
    const res1 = await fetch(url1, { headers: { 'User-Agent': 'Jeparty/1.0' } });
    if (res1.ok) {
      const data: any = await res1.json();
      const pages: any[] = Object.values(data?.query?.pages ?? {});
      for (const page of pages) {
        const check = checkWikipediaSubject(page, source);
        if (check.ok && page.thumbnail?.source) {
          const ret = { ok: true, url: page.thumbnail.source, pageTitle: page.title };
          lookupCache.set(cacheKey, ret);
          return ret;
        }
      }
    }
  } catch (err: any) {
    console.warn('[WikiLookup] Query 1 error:', err);
  }

  // Query 2: If top result fails, try title "{answer} ({source})"
  if (source) {
    const query2 = `${answer.trim()} (${source.trim()})`;
    const url2 = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query2
    )}&gsrlimit=3&prop=pageimages|description|extracts&exintro=1&explaintext=1&pithumbsize=1000&format=json&origin=*`;
    try {
      const res2 = await fetch(url2, { headers: { 'User-Agent': 'Jeparty/1.0' } });
      if (res2.ok) {
        const data: any = await res2.json();
        const pages: any[] = Object.values(data?.query?.pages ?? {});
        for (const page of pages) {
          const check = checkWikipediaSubject(page, source);
          if (check.ok && page.thumbnail?.source) {
            const ret = { ok: true, url: page.thumbnail.source, pageTitle: page.title };
            lookupCache.set(cacheKey, ret);
            return ret;
          }
        }
      }
    } catch (err: any) {
      console.warn('[WikiLookup] Query 2 error:', err);
    }
  }

  const ret = { ok: false, reason: `No valid fictional character image found for "${answer}"` };
  lookupCache.set(cacheKey, ret);
  return ret;
}

export async function lookupAnimeCharacterImage(
  answer: string,
  source: string | null
): Promise<{ ok: boolean; url?: string; reason?: string }> {
  const cacheKey = `anime:${norm(answer)}:::${norm(source || '')}`;
  if (lookupCache.has(cacheKey)) {
    return lookupCache.get(cacheKey)!;
  }

  // 1. AniList GraphQL API
  try {
    const query = `query ($name: String) {
      Page {
        characters(search: $name) {
          name { full }
          image { large }
          media(perPage: 3) {
            nodes {
              title { romaji english }
            }
          }
        }
      }
    }`;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { name: answer } }),
    });

    if (res.ok) {
      const json: any = await res.json();
      const characters: any[] = json?.data?.Page?.characters ?? [];
      for (const char of characters) {
        if (!char.image?.large) continue;
        if (!source) {
          const ret = { ok: true, url: char.image.large };
          lookupCache.set(cacheKey, ret);
          return ret;
        }
        const mediaNodes: any[] = char.media?.nodes ?? [];
        const sourceNorm = norm(source);
        const matchesSource = mediaNodes.some((m) => {
          const r = norm(m.title?.romaji || '');
          const e = norm(m.title?.english || '');
          return (
            (r && (r.includes(sourceNorm) || sourceNorm.includes(r))) ||
            (e && (e.includes(sourceNorm) || sourceNorm.includes(e)))
          );
        });
        if (matchesSource) {
          const ret = { ok: true, url: char.image.large };
          lookupCache.set(cacheKey, ret);
          return ret;
        }
      }
    }
  } catch (err) {
    console.warn('[AniList] fetch note:', err);
  }

  // 2. Fall back to Jikan API
  try {
    const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(answer)}`);
    if (res.ok) {
      const json: any = await res.json();
      const characters: any[] = json?.data ?? [];
      for (const char of characters) {
        const imgUrl = char.images?.jpg?.image_url;
        if (imgUrl && !imgUrl.includes('questionmark')) {
          const ret = { ok: true, url: imgUrl };
          lookupCache.set(cacheKey, ret);
          return ret;
        }
      }
    }
  } catch (err) {
    console.warn('[Jikan] fetch note:', err);
  }

  // 3. Fall back to Wikipedia (using lead image & group shot rejection)
  const wikiRes = await lookupWikipediaCharacterImage(answer, source);
  if (wikiRes.ok && wikiRes.url) {
    const ret = { ok: true, url: wikiRes.url };
    lookupCache.set(cacheKey, ret);
    return ret;
  }

  const ret = { ok: false, reason: 'Failed across AniList, Jikan, and Wikipedia' };
  lookupCache.set(cacheKey, ret);
  return ret;
}

export function fuzzyMatchAudio(trackName: string, artistName: string, answer: string): boolean {
  const parts = answer.split(/\s*-\s*/);
  const expectedTitle = norm(parts[0] || answer);
  const expectedArtist = norm(parts[1] || '');

  const trackNorm = norm(trackName || '');
  const artistNorm = norm(artistName || '');

  const titleMatch =
    trackNorm === expectedTitle ||
    trackNorm.includes(expectedTitle) ||
    expectedTitle.includes(trackNorm);

  if (!expectedArtist) return titleMatch;

  const artistMatch =
    artistNorm === expectedArtist ||
    artistNorm.includes(expectedArtist) ||
    expectedArtist.includes(artistNorm);

  return titleMatch && artistMatch;
}

export async function lookupAudioClip(
  searchTermAudio: string,
  answer: string
): Promise<{ ok: boolean; trackName?: string; artistName?: string; previewUrl?: string; reason?: string }> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(searchTermAudio)}&media=music&limit=5&entity=song`
    );
    if (!res.ok) return { ok: false, reason: `iTunes HTTP ${res.status}` };
    const data: any = await res.json();
    const results: any[] = data.results ?? [];
    if (!results.length) return { ok: false, reason: 'No iTunes results found' };

    for (const r of results) {
      if (!r.previewUrl) continue;
      if (fuzzyMatchAudio(r.trackName || '', r.artistName || '', answer)) {
        return {
          ok: true,
          previewUrl: r.previewUrl,
          trackName: r.trackName,
          artistName: r.artistName,
        };
      }
    }
    return { ok: false, reason: 'Track title or artist did not fuzzy-match answer' };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'iTunes fetch failed' };
  }
}

/* -------------------------------------------------------------------------- */
/*  Groq API Call & Single Slot Replacement                                    */
/* -------------------------------------------------------------------------- */

export type GroqResult =
  | { ok: true; text: string; truncated: boolean }
  | { ok: false; status: number; message: string };

export async function callGroq(apiKey: string, user: string, strict: boolean): Promise<GroqResult> {
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

export async function replaceSingleSlot(
  apiKey: string,
  spec: CategorySpec,
  slot: Slot,
  failedAnswers: string[],
  reason: string
): Promise<BoardQuestion | null> {
  const prompt = `Generate a single replacement question for category "${spec.name}" (${spec.kind.toUpperCase()}).
Difficulty level: ${slot.level}/10 (${LEVEL_DESCRIPTION[slot.level]}).
Points: ${slot.value}.
Previous attempt failed: ${reason}.
Do NOT use any of these answers: ${failedAnswers.join(', ')}.
${subjectGuidance(spec, slot.level)}
Output a JSON object with property "slot".`;

  for (let tryCount = 0; tryCount < 2; tryCount++) {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: TEMPERATURE,
          top_p: TOP_P,
          max_completion_tokens: 1500,
          reasoning_effort: REASONING_EFFORT,
          reasoning_format: 'hidden',
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'single_slot', strict: true, schema: SINGLE_SLOT_SCHEMA },
          },
        }),
      });

      if (!response.ok) continue;
      const data: any = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) continue;
      const parsed = JSON.parse(
        content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json\n?|```/g, '').trim()
      );
      const q = parsed?.slot || parsed;
      if (!q?.answer || !q?.question) continue;

      let question = str(q.question);
      const answer = str(q.answer);
      const searchTerm = str(q.searchTerm);
      let searchTermAudio = str(q.searchTermAudio);
      const source = typeof q.source === 'string' ? q.source.trim() : null;
      const popularityRank = typeof q.popularityRank === 'number' ? q.popularityRank : null;

      const item: BoardQuestion = {
        value: slot.value,
        question,
        answer,
        status: 'hidden',
        source,
        popularityRank,
        level: slot.level,
      };

      if (spec.kind === 'audio') {
        item.searchTermAudio = searchTermAudio || answer;
        item.question = pick(AUDIO_PROMPTS);
        const clip = await lookupAudioClip(item.searchTermAudio, answer);
        if (!clip.ok) {
          failedAnswers.push(answer);
          continue;
        }
      } else if (spec.kind === 'visual') {
        item.searchTerm = searchTerm;
        if (isLocationMode(spec)) {
          item.question = 'Which movie or show features this location?';
          item.source = source || answer;
        } else {
          item.question = pick(VISUAL_PROMPTS);
          if (/anime|manga/i.test(spec.key)) {
            const animeCheck = await lookupAnimeCharacterImage(answer, source);
            if (!animeCheck.ok) {
              failedAnswers.push(answer);
              continue;
            }
          } else {
            const wikiCheck = await lookupWikipediaCharacterImage(answer, source);
            if (!wikiCheck.ok) {
              failedAnswers.push(answer);
              continue;
            }
          }
        }
      }

      return item;
    } catch (err) {
      console.warn('[ReplaceSingleSlot] attempt error:', err);
    }
  }
  return null;
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
        const tierItems = pool[tierForLevel(level)];
        candidates = shuffle(tierItems)
          .filter((item) => {
            const name = typeof item === 'string' ? item : item.name;
            return !used.has(name) && !isBanned(name, bannedList);
          })
          .slice(0, 3)
          .map((item) => (typeof item === 'string' ? item : `${item.name} (${item.source})`));

        candidates.forEach((c) => {
          const rawName = c.replace(/\s*\(.*\)$/, '');
          used.add(rawName);
        });
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

    if (
      !best ||
      checked.hard.length < best.hard.length ||
      (checked.hard.length === best.hard.length && checked.soft.length < best.soft.length)
    ) {
      best = checked;
    }

    if (checked.hard.length === 0 && checked.soft.length === 0) break;

    feedback = [...checked.hard, ...checked.soft].slice(0, 12);
    console.warn(`Attempt ${attempt} rejected:`, feedback);
  }

  if (best && best.hard.length === 0) {
    if (best.soft.length) console.warn('Returning board with unresolved quality issues:', best.soft);

    // Post-generation validation & single-slot replacements for media if needed
    for (let ci = 0; ci < specs.length; ci++) {
      const spec = specs[ci];
      const cat = best.board[ci];
      if (!cat) continue;

      for (let qi = 0; qi < cat.questions.length; qi++) {
        const q = cat.questions[qi];
        const slot = slots[ci][qi];
        const bannedList = [...(banned[spec.key] ?? []), q.answer];

        if (spec.kind === 'audio' && q.searchTermAudio) {
          const clip = await lookupAudioClip(q.searchTermAudio, q.answer);
          if (!clip.ok) {
            console.warn(`[Handler] Audio clip verification failed for "${q.answer}": ${clip.reason}. Requesting replacement.`);
            const replaced = await replaceSingleSlot(apiKey, spec, slot, bannedList, clip.reason || 'No matching audio clip');
            if (replaced) {
              cat.questions[qi] = replaced;
            }
          }
        } else if (spec.kind === 'visual') {
          if (!isLocationMode(spec)) {
            if (/anime|manga/i.test(spec.key)) {
              const check = await lookupAnimeCharacterImage(q.answer, q.source || null);
              if (!check.ok) {
                console.warn(`[Handler] Anime image check failed for "${q.answer}". Requesting replacement.`);
                const replaced = await replaceSingleSlot(apiKey, spec, slot, bannedList, check.reason || 'Image lookup failed');
                if (replaced) cat.questions[qi] = replaced;
              }
            } else {
              const check = await lookupWikipediaCharacterImage(q.answer, q.source || null);
              if (!check.ok) {
                console.warn(`[Handler] Game/Character image check failed for "${q.answer}". Requesting replacement.`);
                const replaced = await replaceSingleSlot(apiKey, spec, slot, bannedList, check.reason || 'Image lookup failed');
                if (replaced) cat.questions[qi] = replaced;
              }
            }
          }
        }
      }
    }

    return res.status(200).json(best.board);
  }

  console.error('Board generation failed:', best?.hard ?? lastError);
  return res.status(500).json({ error: best ? 'AI returned invalid JSON structure' : lastError });
}
