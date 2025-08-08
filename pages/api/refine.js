import { runPIE } from '../../lib/PIEEngine';

export default async function handler(req, res) {
  try {
    console.log("⏳ /api/refine called");

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { intent } = req.body || {};
    if (!intent || !intent.trim()) {
      return res.status(400).json({ error: 'Missing intent' });
    }

    const { refinedIntent, finalPrompt } = await runPIE(intent);
    console.log("✅ Refined output:", refinedIntent);

    // match frontend expectations
    return res.status(200).json({ refinedIntent, finalPrompt });
  } catch (err) {
    console.error("🔥 Error in /api/refine:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
