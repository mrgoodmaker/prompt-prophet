export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { refinedIntent } = req.body;

  if (!refinedIntent || refinedIntent.trim() === '') {
    return res.status(400).json({ message: 'Refined intent is required' });
  }

  // Temporary P.I.E. Layer 2 simulation
  const finalPrompt = `
✨ Prompt Prophet | Layer 2 Output (Deployable Prompt)

You are an expert business acquisition strategist and AI automation consultant.

Using the request below, generate a step-by-step roadmap for achieving this outcome using AI, automation, and minimal capital:

"${refinedIntent.trim()}"

Ensure the roadmap is clear, chronological, and personalized to ambitious, freedom-driven entrepreneurs.

Respond only with the output. Do not explain. Do not apologize. Format cleanly.
`;

  res.status(200).json({ finalPrompt });
}
