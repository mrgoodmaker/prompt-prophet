export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { stage, userInput, refinedIntent } = req.body;

  const systemPrompt = `You are Prompt Prophet — an expert prompt engineer and AI communication specialist. Your entire purpose is to help people get dramatically better results from AI tools through a three-layer refinement process called P.I.E. (Prompt Inception Engine).

You are warm, encouraging, and precise. You never use jargon. You make people feel like they've just discovered a superpower.`;

  let userMessage = '';

  if (stage === 'refine') {
    userMessage = `A user has described what they want to accomplish with AI. Your job is to produce a refined and enhanced version of their intent — more precise, more complete, more actionable — while staying completely true to what they actually want.

User's raw input: "${userInput}"

Produce a refined version that:
- Captures their full intent with precision
- Adds helpful context they may have left out
- Is written in first person from their perspective
- Is 2-4 sentences maximum
- Does NOT add goals they didn't express
- Feels like a better version of what they said, not a different thing entirely

Respond with ONLY the refined intent. No preamble, no explanation, no quotes.`;
  }

  if (stage === 'generate') {
    userMessage = `You are now operating as Layer 2 and Layer 3 of the P.I.E. system.

The user's confirmed intent is: "${refinedIntent}"

Layer 2 — Expert Architecture (internal, invisible to user):
Analyze this intent and determine:
- The optimal prompt structure for this type of request
- The role the AI should play
- The output format that will serve best
- Key constraints and parameters to include
- What to explicitly exclude or avoid

Layer 3 — Seed Prompt Generation:
Using your Layer 2 analysis, generate a precision prompt that will produce the highest quality possible output from any major AI (Claude, ChatGPT, Gemini).

The seed prompt must:
- Open with a clear role assignment for the AI
- State the task with full precision
- Include specific output requirements
- Define tone, length, and format parameters
- Include at least one constraint on what NOT to do
- Be immediately usable — paste and go, no modification needed
- Feel like it was written by a senior prompt engineer with years of experience

Format your response as follows:
SEED_PROMPT_START
[the complete seed prompt here]
SEED_PROMPT_END

Nothing outside those markers.`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    const text = data.content[0].text;

    if (stage === 'refine') {
      return res.status(200).json({ refinedIntent: text.trim() });
    }

    if (stage === 'generate') {
      const match = text.match(/SEED_PROMPT_START\n?([\s\S]*?)\nSEED_PROMPT_END/);
      const seedPrompt = match ? match[1].trim() : text.trim();
      return res.status(200).json({ seedPrompt });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
