export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { name, email, intent } = req.body;

  try {
    const airtableRes = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: { Name: name, Email: email, Intent: intent }
      })
    });

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      throw new Error(data?.error?.message || 'Airtable error');
    }

    res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
