// lib/PIEEngine.js
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runPIE(userIntent, voice = "Strategist") {
  if (!userIntent || userIntent.trim() === "") {
    return { refinedIntent: "", finalPrompt: "No intent provided." };
  }

  try {
    // --------------------------
    // LAYER 4: Intent Clarifier (Enhanced)
    // --------------------------
    const clarifyPrompt = `
You are the PIE Engine.
Rewrite the user's vague or raw goal into a **specific, measurable, time-bound, actionable instruction** in their own voice.
Add **quantitative targets, milestones, or KPIs** if implied or possible.

User Input:
"${userIntent}"

Return only the improved intent, no commentary.
    `;

    const clarifyRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an elite goal refiner focused on measurable, outcome-driven instructions." },
        { role: "user", content: clarifyPrompt }
      ],
      temperature: 0.2
    });
    let refinedIntent = clarifyRes.choices[0].message.content.trim();

    // --------------------------
    // LAYER 3 → LAYER 2: Prompt Architect (Enhanced)
    // --------------------------
    const architectPrompt = `
You are the PIE Engine, building a **master AI prompt**.

Objective:
- Design a deterministic, **high-impact prompt** that makes the model act as a **top-tier expert** in the relevant field.
- Response tone: "${voice}" mode:
    - Strategist = Visionary, high-level planning.
    - Mentor = Supportive, guiding voice.
    - Instructor = Step-by-step, very detailed.
- Ensure **structured, bullet-point output**.
- Include a mandatory final section: **"Hidden Opportunities & Common Pitfalls"** with advanced insights others overlook.

Refined Goal:
"${refinedIntent}"

Rules:
1. Start with: "You are a [expert role]..."
2. Restate the goal clearly.
3. Provide **phased actions**, clear milestones, and success metrics.
4. Use bullet points, numbered steps, or phases.
5. Conclude with **hidden opportunities & pitfalls**.
6. Deliver only the final, copy-pasteable prompt.
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
