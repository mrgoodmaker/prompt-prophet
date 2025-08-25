export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refinedIntent } = req.body;

  try {
    // Replace this logic with real PIE call later
    const finalPrompt = `Here's your master prompt for the LLM:\n\n"Act as an expert strategist. Based on this goal: ${refinedIntent}, craft a plan with depth, clarity, and measurable success."`;

    res.status(200).json({ finalPrompt });
  } catch (error) {
    console.error('Confirm error:', error);
    res.status(500).json({ error: 'Confirmation failed.' });
  }
}
