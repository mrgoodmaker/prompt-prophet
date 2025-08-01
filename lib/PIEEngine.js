// lib/PIEEngine.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Recursive PIE Refinement + Prompt Generation
 * @param {string} userIntent
 * @returns {Promise<{ refinedIntent: string, finalPrompt: string }>}
 */
export async function runPIE(userIntent) {
  if (!userIntent || userIntent.trim() === "") {
    return { refinedIntent: "", finalPrompt: "No intent provided." };
  }

  try {
// --------------------------
// LAYER 4: Intent Clarifier (Enhanced with Role Context + Self-Check)
// --------------------------
const clarifyPrompt = `
You are the PIE Engine (Promptception Intelligence Engine).

Your task: Transform a vague or raw user goal into a **powerful, expert-level directive**.
Rules:
- Make it **precise, actionable, time-bound, and measurable** (include deadlines, metrics, or clear success criteria).
- Replace weak verbs ("help, tell, make") with **strong action verbs** ("build, design, generate, deliver").
- Keep it **specific and focused** on a single main goal.
- Assume the user is seeking guidance from a **world-class expert** in their domain.
- Maintain the user's true intent but **elevate clarity and ambition**.
- Avoid fluff, generic motivational phrasing, or repeating their sentence structure.

USER INPUT:
"${userIntent}"

Step 1: Rewrite it following the above rules.
Step 2: Critique your rewrite: is it clear, ambitious, specific, time-bound, and expert-guided?
Step 3: If not perfect, improve it again.

Return only the **final upgraded directive** (one or two sentences). No explanations.
`;

const clarifyRes = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "You are a master goal refiner for AI prompt engineering." },
    { role: "user", content: clarifyPrompt }
  ],
  temperature: 0.2
});

const refinedIntent = clarifyRes.choices[0].message.content.trim();

    // --------------------------
    // QUALITY CHECK
    // --------------------------
    const qualityCheckPrompt = `
Compare these two statements:
Original: "${userIntent}"
Refined: "${refinedIntent}"

If the refined version is NOT significantly clearer, more actionable, and more strategic than the original, respond ONLY with the word "WEAK".
Otherwise, respond ONLY with "STRONG".
    `;

    const qualityCheck = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a strict quality evaluator for goal refinement." },
        { role: "user", content: qualityCheckPrompt }
      ],
      temperature: 0
    });

    const quality = qualityCheck.choices[0].message.content.trim();

    // --------------------------
    // LAYER 4: Second Refinement if WEAK
    // --------------------------
    if (quality === "WEAK") {
      const secondPassPrompt = `
Take this vague or weak goal and make it **dramatically stronger**:
- Rewrite for maximum clarity, precision, and actionability.
- Assume user wants a **world-class strategy-level plan**, not generic advice.
- Make it specific, measurable, and time-bound if possible.

Goal:
"${userIntent}"

Return only the improved version.
      `;
      const secondPass = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an elite business strategist turning vague goals into razor-sharp instructions." },
          { role: "user", content: secondPassPrompt }
        ],
        temperature: 0.2
      });

      refinedIntent = secondPass.choices[0].message.content.trim();
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
