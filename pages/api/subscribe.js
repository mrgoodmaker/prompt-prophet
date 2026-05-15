// pages/api/subscribe.js
// Prompt Prophet — Mailchimp email capture handler
// Adds new subscribers to the Prompt Prophet Leads audience.
// Returns success for both new subscribers and existing contacts
// so returning users pass through without friction.

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

  const url = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Mailchimp uses HTTP Basic Auth — username is arbitrary, password is the API key
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        tags: ["Prompt Prophet"],
      }),
    });

    const data = await response.json();

    // 200 = new subscriber added successfully
    if (response.ok) {
      console.log("Mailchimp: new subscriber added", email);
      return res.status(200).json({ success: true, status: "subscribed" });
    }

    // 400 with title "Member Exists" = returning user, pass them through
    if (response.status === 400 && data.title === "Member Exists") {
      console.log("Mailchimp: returning user recognized", email);
      return res.status(200).json({ success: true, status: "existing" });
    }

    // Any other error from Mailchimp — log detail server-side, return clean message
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
