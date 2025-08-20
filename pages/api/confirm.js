export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refinedIntent } = req.body;

  console.log('📥 Received Confirm for:', refinedIntent);

  try {
    // Fake Layer 2 prompt generation
    const finalPrompt = `You are an elite AI. Respond to this refined goal: "${refinedIntent}". Guide the user with strategy, tools, and prompt engineering.`;

    console.log('✅ Final Prompt:', finalPrompt);

    return res.status(200).json({ finalPrompt });
  } catch (error) {
    console.error('❌ Confirm error:', error);
    return res.status(500).json({ error: 'Failed to generate final prompt' });
  }
}