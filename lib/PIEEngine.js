// lib/PIEEngine.js
import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ------------------------------
// Utility: Calculate similarity
// ------------------------------
function similarity(a, b) {
  if (!a || !b) return 0;
  const wordsA = a.toLowerCase().split(/\s+/);
  const wordsB = b.toLowerCase().split(/\s+/);
  const overlap = wordsA.filter(w => wordsB.includes(w)).length;
  return (2 * overlap) / (wordsA.length + wordsB.length);
}

/**
 * PIE Engine - Recursive Refinement with Persona Intelligence
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

    // --------------------------
    // 1️⃣ RECURSIVE LAYER 4 REFINEMENT
    // --------------------------
    while (passes < 3) {
      passes++;

      const clarifyPrompt = `
You are the PIE Engine (Promptception Intelligence Engine).
Rewrite the following goal as a **sharp, outcome-focused instruction** in the user's voice. 
- Remove vague verbs ("help", "tell") and filler words.
- Make it measurable, time-bound, and action-oriented where possible (include $ amounts, timelines, milestones, KPIs).
- Avoid fluff or motivational filler.

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
      const sim = similarity(userIntent, candidate);
      const lacksNumbers = !/\d/.test(candidate);

      if (sim < 0.8 && !lacksNumbers) {
        refinedIntent = candidate;
        break;
      }
      refinedIntent = candidate;
    }

    // --------------------------
    // 3a. DOMAIN DETECTION
    // --------------------------
    const domainPrompt = `
Analyze this goal and determine the **primary domain or industry** it belongs to:
"${refinedIntent}"

Return only ONE domain word or short phrase (e.g., Business, AI, Health, Real Estate, Fitness, Marketing, Finance, Education, Technology, Sustainability).
    `;
    const domainRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You classify goals by domain for expert matching." },
        { role: "user", content: domainPrompt }
      ],
      temperature: 0
    });
    const domain = domainRes.choices[0].message.content.trim();

    // --------------------------
    // 3b. ROLE MAPPING + GPT CREATIVE ROLE
    // --------------------------
    const roleMap = {
      "business": "Business Acquisition Strategist",
      "ai": "AI Systems Architect",
      "marketing": "Elite Digital Marketing Strategist",
      "health": "Elite Health Optimization Specialist",
      "fitness": "AI-Powered Fitness Growth Strategist",
      "real estate": "Real Estate Automation Expert",
      "finance": "High-Level Wealth Architect",
      "education": "EdTech Innovation Strategist",
      "technology": "Tech Startup Visionary",
      "sustainability": "Sustainable Innovation Consultant",
      "ecommerce": "Global E-Commerce Growth Strategist"
    };

    let detectedRole = roleMap[domain.toLowerCase()] || "";

    // Ask GPT for a better persona if needed
    if (!detectedRole) {
      const rolePrompt = `
Create the title of a **world-class expert persona** best suited to achieve this goal:
"${refinedIntent}"

Return only the persona title (e.g., "Luxury Real Estate Investment Expert").
      `;
      const roleRes = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You create authoritative expert persona titles." },
          { role: "user", content: rolePrompt }
        ],
        temperature: 0.3
      });
      detectedRole = roleRes.choices[0].message.content.trim();
    }

// --------------------------
// 3c. LAYER 3 → LAYER 2: Prompt Architect with Authority Tone
// --------------------------
const architectPrompt = `
You are the PIE Engine, designing a **master AI prompt**.

Objective:
- Build a deterministic, **world-class prompt** for an LLM.
- It should make the model act as a **top-tier ${detectedRole}**, delivering **elite-level strategy and actionable precision**.
- The prompt must be **commanding, inspiring, structured, and results-driven**.
- Avoid meta-talk about prompts. Return only the **final instructions**.

Refined Goal:
"${refinedIntent}"

Rules:
1. Begin with: "You are a ${detectedRole} with unparalleled expertise and authority in this domain..."
2. Restate the goal clearly with **specific financial, timeline, or measurable targets**.
3. Use a **decisive, expert tone** that inspires confidence and demands high performance.
4. Provide a **structured roadmap** with Immediate, Mid-Term, and Long-Term actions.
5. Include **KPIs, milestones, and quantified outcomes** wherever possible.
6. Conclude with: "🔍 Hidden Opportunities & Common Pitfalls" listing 3–5 high-level, advanced insights others typically miss.
7. Deliver **only the final, copy-pasteable prompt**, with no extra commentary.
`;

    const finalRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
{ role: "system", content: "You are a world-class prompt architect creating elite-level, authoritative instructions." },
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