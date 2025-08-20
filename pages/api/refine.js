// /pages/api/refine.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { intent } = req.body;

  try {
    // Replace this with your actual PIE logic
    const refinedIntent = `Let’s upgrade this intent: "${intent}" into a power move.`; 
    
    res.status(200).json({ refinedIntent });
  } catch (error) {
    console.error('Refine error:', error);
    res.status(500).json({ error: 'Refinement failed' });
  }
}
