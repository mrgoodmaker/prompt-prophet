// pages/api/refine.js
import { runPIE } from '../../lib/PIEEngine';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, intent } = req.body;

  if (!intent || intent.trim() === '') {
    console.error("❌ No intent received");
    return res.status(400).json({ message: 'Intent is required' });
  }

  console.log("🔹 PIE refine request received:", { name, email, intent });

  try {
    const { refinedIntent } = await runPIE(intent);

    if (!refinedIntent) {
      console.error("⚠️ PIE returned no refined intent");
      return res.status(500).json({ message: 'PIE returned no data' });
    }

    console.log("✅ PIE refined intent:", refinedIntent);
    return res.status(200).json({ refinedIntent });

  } catch (error) {
    console.error("❌ PIE Refine Error:", error);
    return res.status(500).json({ message: 'Failed to refine intent', error: error.message });
  }
}