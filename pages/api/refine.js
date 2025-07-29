export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, intent } = req.body;

  if (!intent || intent.trim() === '') {
    return res.status(400).json({ message: 'Intent is required' });
  }

  // --- Simulated Layer 1 Output ---
  const refinedIntent = `Here’s a clearer version of your intent:

"${intent.trim()}"

This refined version can now be used to generate your ideal prompt. If this looks right, let’s continue.`;

  res.status(200).json({ refinedIntent });
}
