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
Take the following raw goal or aspiration and rewrite it following this strict format:

FORMAT TEMPLATE:
[Strong Action Verb] [Specific Objective] that achieves [Quantifiable Result: $ amount, % growth, # users, etc.] within [Timeframe: weeks/months] by [Key Mechanism or Strategy].

RULES:
- Always start with a strong action verb (Launch, Build, Develop, Create, Achieve, Design).
- Must include at least one number and one timeframe.
- Must specify a key strategy or mechanism.
- Keep tone concise, ambitious, and actionable (no fluff).

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
// LAYER 3 → LAYER 2: Prompt Architect + Blind Spot Detector
// --------------------------
const architectPrompt = `
You are the PIE Engine, designing a **master AI prompt**.

Objective:
- Build a deterministic, high-impact prompt for an LLM.
- It should make the model act as a **top-tier expert** in the relevant field for the given goal.
- The prompt must be **structured, step-by-step, practical, and actionable**.
- Avoid any meta-talk about prompts. Just produce the **final prompt text**.

Mandatory Sections:
1. Immediate Actions (0-3 months or equivalent)
2. Mid-Term Actions (next phase)
3. Long-Term Actions (final phase)
4. **🔍 Hidden Opportunities & Pitfalls Most People Miss**
   - Provide at least **5 bullet points** of advanced, non-obvious insights.

Goal:
"${refinedIntent}"

Rules:
1. Start with: "You are a [expert role]..."
2. Restate the goal clearly and ambitiously.
3. Include quantifiable targets, timelines, or milestones.
4. Use bullet points, numbered steps, or phased actions.
5. End with Section 4 containing 5+ unique insights most experts overlook.
6. Deliver only the final copy-pasteable prompt (no explanation).
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
