// pages/api/prompt.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { refinedIntent } = req.body;

  // ✅ Validate input
  if (!refinedIntent || refinedIntent.trim() === '') {
    return res.status(400).json({ message: 'Refined intent is required' });
  }

  try {
    console.log("📩 Received refinedIntent:", refinedIntent);

    // Temporary placeholder logic until PIE Engine integration
    // This ensures the user always gets a clean prompt.
    const finalPrompt = `
You are a world-class AI assistant, expert in understanding user intent and producing powerful, actionable responses.

Goal:
"${refinedIntent}"

Instructions:
- Analyze the user's goal deeply.
- Provide a clear, step-by-step solution or guidance.
- Format your response for maximum clarity and usefulness.
- Do not explain your reasoning, just deliver the actionable answer.

Generate the response now:
`;

    console.log("✅ Sending finalPrompt to client.");

    // Send the result
    return res.status(200).json({ finalPrompt: finalPrompt.trim() });
  } catch (err) {
    console.error('❌ Prompt generation error:', err.message);
    return res.status(500).json({ message: 'Failed to generate prompt' });
  }
}