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

let refinedIntent = clarifyRes.choices[0].message.content.trim();

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
// LAYER 3 → LAYER 2: Prompt Architect (Enhanced with Self-Check)
// --------------------------
const architectPrompt = `
You are the PIE Engine, creating a **master AI prompt** that will direct a top-level LLM.

Objective:
- Transform the user's clarified goal into a **world-class, deterministic prompt**.
- Make the AI behave as a **true expert** in the relevant field.
- Output must be **step-by-step, structured, actionable, and high-impact**.

Rules:
1. Start with: "You are a [specific expert role]..."  
2. Restate the clarified goal clearly and with **ambition and authority**.  
3. Instruct the LLM to respond with **clear phases, numbered steps, and tactical advice**.  
4. Cover **immediate actions, mid-term strategy, and overlooked expert insights**.  
5. End with a call for **high-value, practical, outcome-focused output**.  
6. Do NOT explain the prompt — only return the **final copy-pasteable text**.

Process:
Step 1: Draft the master prompt following these rules.
Step 2: **Critique the draft** — is it:
   - Clear and unambiguous?
   - Assigning the right expert persona?
   - Demanding structured, actionable, detailed output?
   - Likely to produce high-quality results from any LLM?
Step 3: If any answer is "no", improve it and rewrite until perfect.

Clarified Goal:
"${refinedIntent}"

Return only the **final improved prompt** ready for use.
`;

const finalRes = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "You are a world-class AI prompt architect." },
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
