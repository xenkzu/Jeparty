# AI Question Generation System — Detailed Implementation Spec

## Purpose

This module is responsible for generating all quiz content for the Jeopardy-style party game.

It must:
- Generate 25 total questions (5 categories × 5 difficulty levels)
- Ensure structured, predictable output
- Avoid runtime generation (no delays during gameplay)

---

## Non-Negotiable Rules

1. ALL questions must be generated in **ONE API call**
2. Output MUST be valid JSON (no markdown, no text outside JSON)
3. Each category MUST have EXACTLY 5 questions
4. Question values MUST be: 100, 200, 300, 400, 500
5. Difficulty MUST increase with value
6. Questions MUST be:
   - factual
   - unambiguous
   - answerable in 1–2 words or a short phrase
7. NO duplicate questions or answers
8. NO subjective or opinion-based questions

---

## Input Contract

The system receives:

```json
{
  "categories": ["History", "Space", "Movies", "Technology", "Sports"]
}