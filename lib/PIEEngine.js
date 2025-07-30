// lib/PIEEngine.js

export function runPIE(intent) {
  // Layer 4 → Intent Clarifier
  const refinedIntent = clarifyIntent(intent);

  // Layer 3 → Build invisible blueprint
  const blueprint = buildBlueprint(refinedIntent);

  // Layer 2 → Generate final prompt
  const finalPrompt = generateSeedPrompt(refinedIntent, blueprint);

  return { refinedIntent, finalPrompt };
}

function clarifyIntent(input) {
  let cleaned = input.trim();

  // Basic transformation
  cleaned = cleaned.replace(/^i want to/i, 'Guide me to')
                   .replace(/^help me/i, 'Guide me to')
                   .replace(/\bplease\b/gi, '')
                   .replace(/\.$/, '');

  // If too vague, PIE auto-enhances
  if (cleaned.length < 10) {
    cleaned += " with specific, actionable steps.";
  }

  return cleaned;
}

function buildBlueprint(refined) {
  return `
Design a master prompt that makes an LLM act as a top-tier expert in the relevant field.
The goal is: "${refined}".
Output should be actionable, structured (steps, bullet points, timelines),
and avoid fluff. Cover immediate actions, mid-term strategy, and blind spots.
`;
}

function generateSeedPrompt(refined, blueprint) {
  return `
You are a world-class strategist and expert guide with 20+ years of experience.

Goal: "${refined}"

${blueprint}

Deliver:
1. A phased plan (short-term, mid-term, long-term)
2. Clear, step-by-step actions in bullet point format
3. Expert insights that are often overlooked
4. Output must be structured, practical, and high-impact.
`;
}