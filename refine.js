// pages/api/refine.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { intent } = req.body;

  if (!intent) {
    return res.status(400).json({ error: 'Missing intent' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are Prompt Prophet. Your job is to take a user's raw desire or goal and reflect it back to them in symbolic, emotionally resonant, and mythic language. Do not solve it or give advice. Just reflect their deeper intent.`,
          },
          {
            role: 'user',
            content: intent,
          },
        ],
        temperature: 0.85,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const refinedIntent = data.choices?.[0]?.message?.content || 'No response generated.';

    return res.status(200).json({ refinedIntent });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
