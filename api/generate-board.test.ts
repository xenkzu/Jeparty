import assert from 'node:assert';
import {
  parseCategory,
  validate,
  buildWikipediaSearchQuery,
  checkWikipediaSubject,
  isLocationMode,
  buildUserPrompt,
  Slot,
  fuzzyMatchAudio,
  GAME_POOL,
  ANIME_POOL,
} from './generate-board';

console.log('--- Running Acceptance Tests for api/generate-board.ts ---');

// 1. Acceptance Test 1:
// A hard Linkin Park audio slot at level 6 with popularityRank 2 triggers retry feedback.
{
  const spec = parseCategory('Linkin Park -a');
  const slot: Slot = { value: 500, level: 6, candidates: [] };
  const inputJson = JSON.stringify({
    board: [
      {
        category: 'Linkin Park',
        questions: [
          {
            level: 6,
            audience: 'Committed fans',
            popularityRank: 2,
            question: 'Guess the song.',
            answer: 'In the End - Linkin Park',
            source: 'Linkin Park',
            searchTerm: null,
            searchTermAudio: 'In the End Linkin Park',
          },
        ],
      },
    ],
  });

  const validated = validate(inputJson, [spec], [[slot]], {});
  const feedback = [...validated.hard, ...validated.soft];
  const hasRankFeedback = feedback.some(
    (msg) => msg.includes('popularityRank >= 8') && msg.includes('level 6 audio')
  );

  assert.strictEqual(
    hasRankFeedback,
    true,
    'Expected retry feedback for level 6 audio with popularityRank 2'
  );
  console.log('✓ Acceptance Test 1 passed: Level 6 audio with popularityRank 2 triggers retry feedback');
}

// 2. Acceptance Test 2:
// A game answer "Kratos" with source "God of War" builds the query "Kratos God of War",
// and a result whose description says "American actor" is rejected.
{
  const query = buildWikipediaSearchQuery('Kratos', 'God of War');
  assert.strictEqual(query, 'Kratos God of War', 'Query should be "Kratos God of War"');

  const pageActor = {
    title: 'Kratos (actor)',
    description: 'American actor',
    extract: 'John Kratos was an American actor born in 1940.',
    thumbnail: { source: 'https://example.com/kratos.jpg', width: 400, height: 400 },
  };

  const check = checkWikipediaSubject(pageActor, 'God of War');
  assert.strictEqual(check.ok, false, 'Expected American actor to be rejected');
  assert(
    check.reason?.includes('actor'),
    `Expected reason to mention actor, got: ${check.reason}`
  );
  console.log('✓ Acceptance Test 2 passed: "Kratos God of War" query built and "American actor" rejected');
}

// 3. Acceptance Test 3:
// A Wikipedia image with width/height 2.0 is rejected as a group shot.
{
  const pageWide = {
    title: 'Kratos (God of War)',
    description: 'Fictional protagonist of the God of War series',
    extract: 'Kratos is a video game character and protagonist.',
    thumbnail: { source: 'https://example.com/cast_lineup.jpg', width: 1000, height: 500 }, // aspect ratio = 2.0
  };

  const check = checkWikipediaSubject(pageWide, 'God of War');
  assert.strictEqual(check.ok, false, 'Expected wide image (aspect ratio 2.0) to be rejected');
  assert(
    check.reason?.includes('1.6') || check.reason?.includes('group shot'),
    `Expected reason to mention group shot / ratio > 1.6, got: ${check.reason}`
  );
  console.log('✓ Acceptance Test 3 passed: Wikipedia image with width/height 2.0 rejected as group shot');
}

// 4. Acceptance Test 4:
// A movie category gets location-mode prompts and the fixed question text.
{
  const movieSpec = parseCategory('Classic Movies -v');
  assert.strictEqual(isLocationMode(movieSpec), true, 'Category "Classic Movies -v" should be in location mode');

  const slot: Slot = { value: 100, level: 3, candidates: [] };
  const prompt = buildUserPrompt([movieSpec], [[slot]], {}, 'medium', []);
  assert(
    prompt.includes('LOCATION MODE'),
    'Prompt should include LOCATION MODE for movie/tv visual category'
  );

  const inputJson = JSON.stringify({
    board: [
      {
        category: 'Classic Movies',
        questions: [
          {
            level: 3,
            audience: 'Casual film fans',
            popularityRank: null,
            question: 'What is the name of this castle from movies?', // Arbitrary model question
            answer: 'Harry Potter and the Philosopher\'s Stone',
            source: 'Harry Potter and the Philosopher\'s Stone',
            searchTerm: 'Alnwick Castle',
            searchTermAudio: null,
          },
        ],
      },
    ],
  });

  const validated = validate(inputJson, [movieSpec], [[slot]], {});
  assert.strictEqual(
    validated.board[0].questions[0].question,
    'Which movie or show features this location?',
    'Server-side question text must be fixed to "Which movie or show features this location?"'
  );
  console.log('✓ Acceptance Test 4 passed: Movie category receives location-mode prompt and fixed question text');
}

// Extra checks: GAME_POOL and fuzzyMatchAudio
{
  assert(GAME_POOL.length === 4, 'GAME_POOL should have 4 difficulty tiers');
  const kratos = GAME_POOL[0].find((c) => c.name === 'Kratos');
  assert(kratos && kratos.source === 'God of War', 'Kratos should be in tier 0 of GAME_POOL');

  assert.strictEqual(
    fuzzyMatchAudio('In the End', 'Linkin Park', 'In the End - Linkin Park'),
    true,
    'fuzzyMatchAudio should match exact title and artist'
  );
  assert.strictEqual(
    fuzzyMatchAudio('Numb (Official Audio)', 'Linkin Park', 'Numb - Linkin Park'),
    true,
    'fuzzyMatchAudio should match title with extra parens'
  );
  assert.strictEqual(
    fuzzyMatchAudio('Totally Wrong Track', 'Another Artist', 'Numb - Linkin Park'),
    false,
    'fuzzyMatchAudio should reject non-matching track'
  );
  console.log('✓ Extra validations passed: GAME_POOL structure and fuzzyMatchAudio');
}

console.log('\nALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! 🎉');
