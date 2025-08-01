// lib/PIEEngine.js
import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Runs the full PIE process:
 * Layer 4 → Layer 3 → Layer 2
 * @param {string} userIntent
 * @returns {Promise<{ refinedIntent: string, finalPrompt: string }>}
 */
export async function runPIE(userIntent) {
  if (!userIntent || userIntent.trim() === "") {
    return { refinedIntent: "", finalPrompt: "No intent provided." };
  }

  try {
    console.log("🔹 PIE Engine starting for intent:", userIntent);

 // --------------------------
// LAYER 4: Intent Clarifier
// --------------------------
const clarifyPrompt = `
You are the PIE Engine (Promptception Intelligence Engine).

Transform the user's raw goal or aspiration below into a **highly actionable, expert-level directive** that would guide an AI assistant toward creating world-class results.

Rewrite it to:
- Be in **command form** ("Design...", "Build...", "Deliver...", "Generate...").
- Be **precise, goal-driven, and outcome-focused** (not vague or emotional).
- Explicitly **demand a roadmap, strategy, or actionable solution**.
- Remove uncertainty or weak phrasing ("I want to", "I don’t know").
- Preserve intent but **upgrade it to sound like a request to a top-tier consultant**.
- Output only the transformed directive, no explanations or extra text.

User Input:
"${userIntent}"
`;

    const clarifyRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precision intent refiner." },
        { role: "user", content: clarifyPrompt }
      ],
      temperature: 0.2
    });

    const refinedIntent = clarifyRes.choices[0].message.content.trim();
    console.log("✅ Refined Intent:", refinedIntent);

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
    console.log("✅ Final Prompt:", finalPrompt);

    return { refinedIntent, finalPrompt };

  } catch (error) {
    console.error("❌ PIE Engine Error:", error);
    return { refinedIntent: "", finalPrompt: "Prompt generation failed due to an internal error." };
  }
} // ✅ This closing brace was missing before
