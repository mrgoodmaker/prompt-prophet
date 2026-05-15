// pages/api/subscribe.js
// Prompt Prophet — Mailchimp email capture handler
// Adds new subscribers to the Prompt Prophet Leads audience.
// Uses PUT (upsert) instead of POST so existing contacts in any
// status are accepted and updated rather than rejected.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required" });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const server = process.env.MAILCHIMP_SERVER;

  if (!apiKey || !audienceId || !server) {
    console.error("Mailchimp environment variables are not fully configured");
    return res.status(500).json({ error: "Email service is not configured" });
  }

  try {
    // MD5 hash of lowercase email is required for Mailchimp member upsert
    const emailHash = await md5(email.toLowerCase().trim());
    const url = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members/${emailHash}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
      },
      body: JSON.stringify({
        email_address: email.toLowerCase().trim(),
        status_if_new: "subscribed",
        // Do not force status change for existing contacts —
        // respect their current subscription status
        tags: ["Prompt Prophet"],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Mailchimp: contact upserted successfully", email, data.status);
      return res.status(200).json({ success: true, status: data.status });
    }

    console.error("Mailchimp API error:", data.title, data.detail);
    return res.status(400).json({
      error: "We couldn't add that email address. Please try again.",
    });

  } catch (error) {
    console.error("Mailchimp subscribe unexpected error:", error.message);
    return res.status(500).json({
      error: "Something went wrong. Please try again.",
    });
  }
}

// Native MD5 implementation — no external dependencies required.
// Mailchimp uses MD5-hashed lowercase email as the member identifier.
async function md5(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
