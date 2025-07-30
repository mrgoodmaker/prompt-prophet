// pages/api/refine.js

import { runPIE } from '../../lib/PIEEngine';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, intent } = req.body;

  if (!intent || intent.trim() === '') {
    return res.status(400).json({ message: 'Intent is required' });
  }

  try {
    const { refinedIntent } = runPIE(intent);
    res.status(200).json({ refinedIntent });
  } catch (error) {
    console.error('❌ PIE Refine Error:', error);
    res.status(500).json({ message: 'Failed to refine intent' });
  }
}
