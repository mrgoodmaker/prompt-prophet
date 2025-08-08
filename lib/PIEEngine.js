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
- Build a deterministic, high-impact prompt for an LLM.
- It should make the model act as a **top-tier ${detectedRole}** for the given goal.
- The prompt must be **structured, step-by-step, practical, and actionable**.
- Avoid any meta-talk about prompts. Just produce the **final prompt text**.

Mandatory Sections:
1. Immediate Actions (0–3 months)
2. Mid-Term Actions (next phase)
3. Long-Term Actions (final phase)
4. **🔍 Hidden Opportunities & Pitfalls Most People Miss**
   - Provide at least **5 bullet points** of advanced, non-obvious insights.

Goal:
Refined Goal:
"${refinedIntent}"

Rules:
1. Start with: "You are a ${detectedRole}..."
2. Restate the goal clearly and ambitiously.
3. Include quantifiable targets, timelines, or milestones.
4. Use bullet points, numbered steps, or phased actions.
5. End with Section 4 containing 5+ unique insights most experts overlook.
6. Deliver only the final copy-pasteable prompt (no explanation).
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