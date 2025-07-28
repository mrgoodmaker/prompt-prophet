// pages/api/prompt.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { refinedIntent } = req.body;

  if (!refinedIntent) {
    return res.status(400).json({ error: 'Missing refined intent' });
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
            content: `You are Prompt Prophet, a master of prompt architecture. Your job is to take a refined user intention and return a powerful, precise, emotionally intelligent prompt they can copy/paste into an LLM. This is NOT a result or answer — only a crafted prompt to guide AI. Use symbolic clarity, directive framing, and include useful role/context if helpful.`,
          },
          {
            role: 'user',
            content: refinedIntent,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const prompt = data.choices?.[0]?.message?.content || 'No prompt generated.';

    return res.status(200).json({ prompt });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
