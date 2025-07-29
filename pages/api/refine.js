export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, intent } = req.body;

  if (!intent || intent.trim() === '') {
    return res.status(400).json({ message: 'Intent is required' });
  }

  // --- Simulated P.I.E. Layer 1 Output ---
  const refinedIntent = `
🧠 P.I.E. Interpretation Engine | LAYER 1: REFINED INTENT

Original Input:
"${intent.trim()}"

Refined Directive:
"${intent.trim().replace(/^i want to|help me/i, 'Guide me to').replace(/\.$/, '')}."

Clarification Strategy:
- Transformed general intent into actionable language
- Reframed request using the Prompt Prophet syntax structure
- Optimized for LLM comprehension and clarity

If this reads as your true intention, proceed.
Otherwise, revise and try again.
`;

  res.status(200).json({ refinedIntent });
}
