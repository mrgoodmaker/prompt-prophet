// lib/PIEEngine.js
import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Runs the full PIE process with recursion for quality control
 * @param {string} userIntent
 * @returns {Promise<{ refinedIntent: string, finalPrompt: string }>}
 */
export async function runPIE(userIntent) {
  if (!userIntent || userIntent.trim() === "") {
    return { refinedIntent: "", finalPrompt: "No intent provided." };
  }

  try {
    // --------------------------
    // LAYER 4: Intent Clarifier
    // --------------------------
    const clarifyPrompt = `
You are the PIE Engine (Promptception Intelligence Engine).
Rewrite the following raw goal into a **clear, outcome-focused instruction**.
Make it precise, actionable, and ambitious, removing filler words and weak phrasing.

User Input:
"${userIntent}"

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

    const refinedIntent = clarifyRes.choices[0].message.content.trim();

    // --------------------------
    // LAYER 3 → LAYER 2: Recursive Prompt Architect
    // --------------------------

    async function generatePrompt(goal) {
      const architectPrompt = `
You are the PIE Engine, designing a **master AI prompt**.

Objective:
- Build a deterministic, high-impact prompt for an LLM.
- The prompt must:
  1. Assign an expert role (e.g., "You are a top-tier strategist...")
  2. Restate the goal clearly
  3. Provide structured instructions with **bullet points or numbered steps**
  4. Cover immediate, mid-term, and long-term actions
  5. Include expert insights and overlooked strategies
- The final result must be **copy-pasteable**, powerful, and complete.

Goal:
"${goal}"

Return only the final prompt text, no commentary.
      `;

      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a world-class prompt architect." },
          { role: "user", content: architectPrompt }
        ],
        temperature: 0.3
      });

      return res.choices[0].message.content.trim();
    }

    // Quality check function
    function isHighQuality(output) {
      const hasRole = output.toLowerCase().includes("you are");
      const hasBullets = output.includes("-") || output.includes("1.");
      const longEnough = output.split(" ").length > 50;
      return hasRole && hasBullets && longEnough;
    }

    let finalPrompt = "";
    let attempts = 0;

    // Retry loop for quality assurance
    while (attempts < 3) {
      attempts++;
      const draftPrompt = await generatePrompt(refinedIntent);
      if (isHighQuality(draftPrompt)) {
        finalPrompt = draftPrompt;
        break;
      }
      console.warn(`⚠️ PIE output too weak on attempt ${attempts}, retrying...`);
    }

    if (!finalPrompt) {
      finalPrompt = "Prompt generation failed after multiple attempts. Please try again.";
    }

    return { refinedIntent, finalPrompt };

  } catch (error) {
    console.error("❌ PIE Engine Error:", error);
    return { refinedIntent: "", finalPrompt: "Prompt generation failed due to an internal error." };
  }
}