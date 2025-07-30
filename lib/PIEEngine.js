// lib/PIEEngine.js

import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * runPIE
 * Handles Layer 4 -> Layer 3 -> Layer 2 transformation.
 * Returns a refined intent (L4 output) and a master prompt (L2).
 */
export async function runPIE(userIntent) {
  try {
    // --- Layer 4: Clarify Intent ---
    const layer4 = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are PIE Layer 4. Your job is to rewrite vague, emotional, or unclear user goals into precise, outcome-focused directives, preserving their true intent."
        },
        {
          role: "user",
          content: userIntent
        }
      ],
      temperature: 0.4
    });

    const refinedIntent = layer4.choices[0].message.content.trim();

    // --- Layer 3+2: Generate Master Prompt ---
    const layer2 = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            `You are PIE Layers 3 and 2 combined. 
             Build the PERFECT, copy-pasteable prompt for any LLM based on the user's refined goal.
             RULES:
             - Define an expert role relevant to their intent
             - Restate their goal clearly
             - Provide instructions for structured, actionable, step-by-step output
             - Cover immediate actions, mid-term strategies, blind spots
             - Output ONLY the final master prompt.`
        },
        {
          role: "user",
          content: refinedIntent
        }
      ],
      temperature: 0.3
    });

    const finalPrompt = layer2.choices[0].message.content.trim();

    return { refinedIntent, finalPrompt };
  } catch (error) {
    console.error("🔥 PIE Engine Error:", error);
    return { refinedIntent: "Failed to refine intent", finalPrompt: "Prompt generation failed." };
  }
}