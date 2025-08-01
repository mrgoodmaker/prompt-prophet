// lib/PIEEngine.js
import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Utility: Calculate similarity between two strings
function similarity(a, b) {
  if (!a || !b) return 0;
  const wordsA = a.toLowerCase().split(/\s+/);
  const wordsB = b.toLowerCase().split(/\s+/);
  const overlap = wordsA.filter(w => wordsB.includes(w)).length;
  return (2 * overlap) / (wordsA.length + wordsB.length);
}

/**
 * PIE Engine - Recursive Refinement
 * @param {string} userIntent
 * @returns {Promise<{ refinedIntent: string, finalPrompt: string }>}
 */
export async function runPIE(userIntent) {
  if (!userIntent || userIntent.trim() === "") {
    return { refinedIntent: "", finalPrompt: "No intent provided." };
  }

  try {
    let refinedIntent = userIntent.trim();
    let passes = 0;

    while (passes < 3) {
      passes++;

      // --------------------------
      // LAYER 4: Intent Clarifier
      // --------------------------
      const clarifyPrompt = `
You are the PIE Engine (Promptception Intelligence Engine).
Take the following raw goal or aspiration and rewrite it as a **sharp, outcome-focused instruction** in the user's voice. 
- Remove vague verbs ("help", "tell") and filler words.
- Make it measurable, time-bound, and action-oriented where possible (include $ amounts, timelines, or milestones).
- Avoid fluff or motivational talk. Be clear, specific, and ambitious.

User Input:
"${refinedIntent}"

Return only the improved intent, no commentary.
      `;

      const clarifyRes = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a precision intent refiner." },
          { role: "user", content: clarifyPrompt }
        ],
        temperature: 0.2
      });

      const candidate = clarifyRes.choices[0].message.content.trim();

      // Check similarity
      const sim = similarity(userIntent, candidate);
      const lacksNumbers = !/\d/.test(candidate);

      // If candidate is good, accept and break loop
      if (sim < 0.8 && !lacksNumbers) {
        refinedIntent = candidate;
        break;
      }

      // Otherwise, refine again using candidate
      refinedIntent = candidate;
    }

    // --------------------------
    // LAYER 3 → LAYER 2: Prompt Architect
    // --------------------------
    const architectPrompt = `
You are the PIE Engine, designing a **master AI prompt**.

Objective:
- Build a deterministic, high-impact prompt for an LLM.
- It should make the model act as a **top-tier expert** in the relevant field for the given goal.
- The prompt must be **structured, step-by-step, practical, and actionable**.
- Avoid any meta-talk about prompts. Just produce the **final prompt text**.

Refined Goal:
"${refinedIntent}"

Rules:
1. Start with: "You are a [expert role]..."
2. Restate the goal clearly.
3. Give instructions for a structured, high-quality response.
4. Use bullet points, numbered steps, or phases.
5. Cover immediate, mid-term, and long-term actions.
6. Include insights that are often overlooked by beginners.
7. Deliver only the final copy-pasteable prompt (no explanation).
    `;

    const finalRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a world-class prompt architect." },
        { role: "user", content: architectPrompt }
      ],
      temperature: 0.3
    });

    const finalPrompt = finalRes.choices[0].message.content.trim();

    return { refinedIntent, finalPrompt };

  } catch (error) {
    console.error("❌ PIE Engine Error:", error);
    return { refinedIntent: "", finalPrompt: "Prompt generation failed due to an internal error." };
  }
}
