import assert from 'node:assert';
import {
  parseCategory,
  validate,
  buildWikipediaSearchQuery,
  checkWikipediaSubject,
  isSceneMode,
  buildUserPrompt,
  Slot,
  fuzzyMatchAudio,
  GAME_POOL,
  filterTmdbBackdrops,
} from './generate-board';
import {
  resolveQuestionImage,
  clearImageCache,
  candidateCache,
  buildCandidateCacheKey,
  brokenUrls,
} from '../src/services/imageService';

console.log('--- Running Acceptance Tests for Jeparty Scene Mode & Image Reload ---');

// 1. Audio Acceptance Test:
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
  console.log('✓ Test 1 passed: Level 6 audio with popularityRank 2 triggers retry feedback');
}

// 2. Wikipedia Search Query and Subject Rejection
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
  console.log('✓ Test 2 passed: "Kratos God of War" query built and "American actor" rejected');
}

// 3. Scene Mode Category Detection: Whole words only
{
  // Should match:
  assert.strictEqual(isSceneMode(parseCategory('Classic Movies -v')), true);
  assert.strictEqual(isSceneMode(parseCategory('Action Film -v')), true);
  assert.strictEqual(isSceneMode(parseCategory('Great Films -v')), true);
  assert.strictEqual(isSceneMode(parseCategory('World Cinema -v')), true);
  assert.strictEqual(isSceneMode(parseCategory('90s TV -v')), true);
  assert.strictEqual(isSceneMode(parseCategory('Popular Show -v')), true);
  assert.strictEqual(isSceneMode(parseCategory('Hit TV Shows -v')), true);
  assert.strictEqual(isSceneMode(parseCategory('Drama Series -v')), true);

  // Should NOT match (whole words only):
  assert.strictEqual(isSceneMode(parseCategory('Shoe Brands -v')), false);
  assert.strictEqual(isSceneMode(parseCategory('Shower Thoughts -v')), false);
  assert.strictEqual(isSceneMode(parseCategory('Showcase Events -v')), false);
  assert.strictEqual(isSceneMode(parseCategory('Classic Movies -t')), false); // not visual

  console.log('✓ Test 3 passed: Scene mode category detection uses whole words only');
}

// 4. Scene Mode Prompt and Server-Side Question Text Enforced
{
  const movieSpec = parseCategory('Classic Movies -v');
  const slot: Slot = { value: 100, level: 3, candidates: [] };
  const prompt = buildUserPrompt([movieSpec], [[slot]], {}, 'medium', []);
  assert(
    prompt.includes('SCENE MODE: identify movie/show from scene backdrop still'),
    'Prompt should include SCENE MODE description'
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
            question: 'Arbitrary model prompt question?',
            answer: 'The Matrix',
            source: '1999 movie',
            searchTerm: 'The Matrix',
            searchTermAudio: null,
          },
        ],
      },
    ],
  });

  const validated = validate(inputJson, [movieSpec], [[slot]], {});
  assert.strictEqual(
    validated.board[0].questions[0].question,
    'Which movie or show is this scene from?',
    'Server-side question text must be strictly "Which movie or show is this scene from?"'
  );
  assert.strictEqual(validated.board[0].questions[0].searchTerm, 'The Matrix');
  assert.strictEqual(validated.board[0].questions[0].source, '1999 movie');

  console.log('✓ Test 4 passed: Scene mode prompt and server-side question text enforced');
}

// 5. TMDB Backdrops: ONLY backdrops with iso_639_1 null, width >= 1280, aspect ratio 1.6-1.9, NEVER posters or logos
{
  const rawBackdrops = [
    // Valid 1: aspect ratio 1.778, width 1920, height 1080, null iso_639_1
    {
      file_path: '/valid1.jpg',
      iso_639_1: null,
      width: 1920,
      height: 1080,
      aspect_ratio: 1.7777,
      vote_average: 8.5,
    },
    // Valid 2: aspect ratio 1.667, width 1280, height 768, undefined iso_639_1
    {
      file_path: '/valid2.jpg',
      iso_639_1: undefined,
      width: 1280,
      height: 768,
      aspect_ratio: 1.6667,
      vote_average: 7.0,
    },
    // Invalid: text overlay (iso_639_1 is 'en')
    {
      file_path: '/text_overlay.jpg',
      iso_639_1: 'en',
      width: 1920,
      height: 1080,
      aspect_ratio: 1.7777,
      vote_average: 9.9,
    },
    // Invalid: width < 1280 (too small)
    {
      file_path: '/low_res.jpg',
      iso_639_1: null,
      width: 1000,
      height: 562,
      aspect_ratio: 1.7777,
      vote_average: 9.0,
    },
    // Invalid: aspect ratio outside 1.6 - 1.9 (portrait/poster ratio 0.67)
    {
      file_path: '/poster_ratio.jpg',
      iso_639_1: null,
      width: 1280,
      height: 1920,
      aspect_ratio: 0.6667,
      vote_average: 8.0,
    },
    // Invalid: ultra-wide aspect ratio > 1.9 (2.39 cinematic)
    {
      file_path: '/ultrawide.jpg',
      iso_639_1: null,
      width: 1920,
      height: 800,
      aspect_ratio: 2.4,
      vote_average: 8.0,
    },
  ];

  const filtered = filterTmdbBackdrops(rawBackdrops);
  assert.strictEqual(filtered.length, 2, 'Expected exactly 2 valid backdrops to pass filters');
  assert(
    filtered.every((f) => f.url.startsWith('https://image.tmdb.org/t/p/w1280/')),
    'All backdrop URLs must be prefixed with https://image.tmdb.org/t/p/w1280/'
  );
  assert(
    filtered.some((f) => f.url.includes('valid1.jpg')),
    'Expected valid1.jpg to be included'
  );
  assert(
    filtered.some((f) => f.url.includes('valid2.jpg')),
    'Expected valid2.jpg to be included'
  );
  assert(
    !filtered.some((f) => f.url.includes('text_overlay.jpg')),
    'Images with non-null iso_639_1 must be rejected'
  );
  assert(
    !filtered.some((f) => f.url.includes('low_res.jpg')),
    'Images with width < 1280 must be rejected'
  );
  assert(
    !filtered.some((f) => f.url.includes('poster_ratio.jpg')),
    'Poster aspect ratios must be rejected'
  );

  console.log('✓ Test 5 passed: TMDB backdrop filtering enforces iso_639_1 null, width >= 1280, and aspect ratio 1.6-1.9');
}

// 6. Reload yields different URLs until candidates run out & cycles back
{
  clearImageCache();

  const mockCandidates = [
    { url: 'https://example.com/scene1.jpg' },
    { url: 'https://example.com/scene2.jpg' },
    { url: 'https://example.com/scene3.jpg' },
  ];

  const qSpec = {
    question: 'Which movie or show is this scene from?',
    answer: 'Inception',
    searchTerm: 'Inception',
    source: '2010 movie',
  };
  const categoryName = 'Cinema -v';

  // Seed candidateCache per answer+source
  const cacheKey = buildCandidateCacheKey(qSpec.answer, qSpec.source);
  candidateCache.set(cacheKey, mockCandidates);

  // 1st load
  const load1 = await resolveQuestionImage(qSpec, categoryName);
  assert.strictEqual(load1.url, 'https://example.com/scene1.jpg');
  assert.strictEqual(load1.noOtherImages, false);

  // 1st reload: advances to next candidate
  const reload1 = await resolveQuestionImage(qSpec, categoryName, { isReload: true });
  assert.strictEqual(reload1.url, 'https://example.com/scene2.jpg');
  assert.notStrictEqual(reload1.url, load1.url, 'Reload must not return same URL');

  // 2nd reload: advances to next candidate
  const reload2 = await resolveQuestionImage(qSpec, categoryName, { isReload: true });
  assert.strictEqual(reload2.url, 'https://example.com/scene3.jpg');
  assert.notStrictEqual(reload2.url, reload1.url, 'Reload must not return same URL');

  // 3rd reload: candidates exhausted -> cycles back to start
  const reload3 = await resolveQuestionImage(qSpec, categoryName, { isReload: true });
  assert.strictEqual(reload3.url, 'https://example.com/scene1.jpg');

  console.log('✓ Test 6 passed: Reload yields different URLs until exhausted and cycles back');
}

// 7. A broken URL is skipped (onError) and moves to the next candidate
{
  clearImageCache();

  const mockCandidates = [
    { url: 'https://example.com/imgA.jpg' },
    { url: 'https://example.com/imgB_broken.jpg' },
    { url: 'https://example.com/imgC.jpg' },
  ];

  const qSpec = {
    question: 'Which movie or show is this scene from?',
    answer: 'Interstellar',
    searchTerm: 'Interstellar',
    source: '2014 movie',
  };
  const categoryName = 'Sci-Fi Movies -v';

  const cacheKey = buildCandidateCacheKey(qSpec.answer, qSpec.source);
  candidateCache.set(cacheKey, mockCandidates);

  // Initial load -> imgA
  const load1 = await resolveQuestionImage(qSpec, categoryName);
  assert.strictEqual(load1.url, 'https://example.com/imgA.jpg');

  // Next reload -> imgB_broken
  const reload1 = await resolveQuestionImage(qSpec, categoryName, { isReload: true });
  assert.strictEqual(reload1.url, 'https://example.com/imgB_broken.jpg');

  // imgB fails to load -> handleImageError reports failedUrl
  const errorHandled = await resolveQuestionImage(qSpec, categoryName, {
    failedUrl: 'https://example.com/imgB_broken.jpg',
  });
  // Must skip imgB and advance directly to imgC
  assert.strictEqual(errorHandled.url, 'https://example.com/imgC.jpg');
  assert.strictEqual(brokenUrls.has('https://example.com/imgB_broken.jpg'), true);

  // Subsequent reload must cycle between imgA and imgC only, never returning imgB_broken
  const reload2 = await resolveQuestionImage(qSpec, categoryName, { isReload: true });
  assert.strictEqual(reload2.url, 'https://example.com/imgA.jpg');

  const reload3 = await resolveQuestionImage(qSpec, categoryName, { isReload: true });
  assert.strictEqual(reload3.url, 'https://example.com/imgC.jpg');

  console.log('✓ Test 7 passed: Broken URL is recorded and skipped on error');
}

// 8. Single image candidate hides reload button and returns noOtherImages: true
{
  clearImageCache();

  const singleCandidate = [{ url: 'https://example.com/only_one.jpg' }];
  const qSpec = {
    question: 'Who is this?',
    answer: 'Mario',
    searchTerm: 'Mario',
  };
  const categoryName = 'Gaming -v';

  candidateCache.set(buildCandidateCacheKey(qSpec.answer, null), singleCandidate);

  const res = await resolveQuestionImage(qSpec, categoryName);
  assert.strictEqual(res.url, 'https://example.com/only_one.jpg');
  assert.strictEqual(res.hasAlternatives, false);
  assert.strictEqual(res.noOtherImages, true);

  console.log('✓ Test 8 passed: Single candidate sets noOtherImages: true');
}

// 9. Extra checks: fuzzyMatchAudio and GAME_POOL
{
  assert(GAME_POOL.length === 4, 'GAME_POOL should have 4 difficulty tiers');
  assert.strictEqual(
    fuzzyMatchAudio('In the End', 'Linkin Park', 'In the End - Linkin Park'),
    true
  );
  assert.strictEqual(
    fuzzyMatchAudio('Totally Wrong Track', 'Another Artist', 'Numb - Linkin Park'),
    false
  );
  console.log('✓ Test 9 passed: GAME_POOL structure and fuzzyMatchAudio');
}

console.log('\n========================================');
console.log('ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! 🎉');
console.log('========================================\n');
