// lib/PIEEngine.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runPIE(userIntent) {
  if (!userIntent || userIntent.trim() === "") {
    return { refinedIntent: "", finalPrompt: "No intent provided." };
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a goal clarification assistant. Reword vague goals into clear, outcome-focused instructions.",
        },
        {
          role: "user",
          content: `User's goal: "${userIntent}"\n\nReturn a sharper version of this goal with more clarity and structure.`,
        },
      ],
      temperature: 0.3,
    });

    const refinedIntent = response.choices[0].message.content.trim();

    return {
      refinedIntent,
      finalPrompt: "",
    };
  } catch (error) {
    console.error("❌ PIE Engine error:", error);
    return {
      refinedIntent: "",
      finalPrompt: "Refinement failed.",
    };
  }
}
