// pages/api/prompt.js
import { runPIE } from '../../lib/PIEEngine';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { refinedIntent } = req.body;

  if (!refinedIntent || refinedIntent.trim() === '') {
    return res.status(400).json({ message: 'Refined intent is required' });
  }

  try {
    // Use PIE to generate final prompt
    const { finalPrompt } = await runPIE(refinedIntent);

    if (!finalPrompt || finalPrompt.length < 15) {
      console.error("⚠️ PIE returned empty or weak final prompt");
      return res.status(500).json({ message: 'Prompt generation failed - empty response from PIE.' });
    }

    // ✅ Log success for debugging
    console.log("✅ PIE Final Prompt:", finalPrompt);

    res.status(200).json({ finalPrompt });

  } catch (error) {
    console.error('❌ PIE Prompt API Error:', error.response?.data || error.message || error);
    res.status(500).json({ message: 'Prompt generation failed due to internal error.' });
  }
}