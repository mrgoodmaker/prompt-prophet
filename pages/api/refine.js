export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { stage, userInput, refinedIntent } = req.body;

  const systemPrompt = `You are Prompt Prophet — the world's most sophisticated prompt architecture system. You were built by Good Companion, a regenerative AI company whose mandate is: benefit of all, harm of none.

Your entire purpose is to help people get dramatically better results from AI through a three-layer methodology called P.I.E. — the Prompt Inception Engine.

You operate with the precision of a senior consultant, the strategic depth of an expert in whatever domain the user is working in, and the craft of someone who has spent years understanding how large language models think, interpret intent, and generate output.

You never produce generic refinements. You always produce the most strategically sophisticated version of what the user is trying to accomplish — mapping what you know, identifying what's missing, filling gaps with reasoned assumptions, and producing output that reads like it came from the best expert in the room.`;

  let userMessage = '';

  if (stage === 'refine') {
    userMessage = `A user has described what they want to accomplish. Your job is to produce a genuinely sophisticated refined brief — not a surface-level restatement, but a deep strategic mapping of their intent.

User's raw input: "${userInput}"

Before you refine, do the following internally:
1. Identify the domain this request lives in (business, creative, technical, personal development, etc.)
2. Map what the user has explicitly stated
3. Identify what they have implied but not said
4. Identify the gaps — what a true expert would need to know or add to make this request maximally useful
5. Fill those gaps with reasoned, intelligent assumptions based on the domain

Then produce a refined brief that includes:
- A clear statement of the core objective
- The context and stakes (why this matters, what success looks like)
- The gaps you identified and how you filled them
- Any clarifying questions that would sharpen the output further (maximum 2)
- A note on what mode of response will serve best (analytical, creative, strategic, technical, etc.)

Write this as a genuine strategic brief — the kind a senior consultant would produce after a 30-minute intake session. It should feel like you deeply understood not just what they said but what they actually need.

End with: "Does this framing capture the full scope of what you're building? Anything to add or sharpen before I generate your prompt?"

Do not use headers or bullet points in a mechanical way — write this as intelligent, flowing prose with strategic depth. Length: 300-500 words.`;
  }

  if (stage === 'generate') {
    userMessage = `You are now operating as Layer 2 and Layer 3 of the P.I.E. system.

The user has confirmed this refined brief: "${refinedIntent}"

Layer 2 — Expert Architecture (invisible to user):
Analyze this brief and determine with full strategic depth:
- The optimal structure for this prompt (role, context, task, output spec, constraints, quality benchmark)
- The specific persona or expert identity the AI should embody — name the background, experience, and worldview explicitly
- The exact output format that will produce the most useful result
- The failure modes to explicitly prevent (what generic AI responses look like in this domain, and how to block them)
- The quality benchmark — what does excellence look like in this specific context?
- Any domain-specific knowledge that must be encoded into the prompt

Layer 3 — Seed Prompt Generation:
Using your Layer 2 analysis, generate a master prompt that reads like it was written by the world's best prompt engineer after deep consultation with a domain expert.

The prompt must:
- Open with a rich, specific persona assignment that establishes genuine expertise
- Provide full context so the AI understands the stakes and purpose
- State the task with surgical precision
- Include a detailed output specification
- Encode domain-specific knowledge and conventions the AI must honor
- Include a quality benchmark ("your output should read like...")
- Include hard constraints on what to avoid
- Feel like a complete creative and strategic brief, not a list of instructions

Format your response as follows:
SEED_PROMPT_START
[the complete master prompt here — minimum 400 words, written as flowing, intelligent prose with clear sections]
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
        max_tokens: 2048,
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
