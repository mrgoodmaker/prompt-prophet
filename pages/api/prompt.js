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
    const { finalPrompt } = runPIE(refinedIntent);
    return res.status(200).json({ finalPrompt });
  } catch (error) {
    console.error('❌ PIE Prompt Error:', error);
    return res.status(500).json({ message: 'Failed to generate prompt' });
  }
}