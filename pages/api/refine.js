// /pages/api/refine.js
import { runPIE } from '../../lib/PIEEngine';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { intent } = req.body;

  try {
    const result = await runPIE(intent);
    const refinedIntent = result.refinedIntent || 'Refinement failed.';
    return res.status(200).json({ refinedIntent });
  } catch (error) {
    console.error('Refine error:', error);
    return res.status(500).json({ error: 'Refinement failed.' });
  }
}
