export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, intent } = req.body;

  if (!intent || intent.trim() === '') {
    return res.status(400).json({ message: 'Intent is required' });
  }

  // Extracted directive only (Layer 1 logic stub)
  const directive = intent
    .trim()
    .replace(/^i want to|help me/i, 'Guide me to')
    .replace(/\.$/, '') + '.';

  res.status(200).json({ refinedIntent: directive });
}
