// pages/api/subscribe.js
// Prompt Prophet — Mailchimp email capture + Upstash Redis usage tracking
// Adds subscriber to Mailchimp and initializes their prompt count in Redis.
// Uses PUT upsert so existing contacts in any status pass through cleanly.

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

  if (!apiKey || !audienceId) {
    console.error("Mailchimp environment variables are not fully configured");
    return res.status(500).json({ error: "Email service is not configured" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Step 1 — Upsert contact into Mailchimp
    const emailHash = md5(normalizedEmail);
    const server = apiKey.split('-').pop();
    const mailchimpUrl = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members/${emailHash}`;

    const mailchimpResponse = await fetch(mailchimpUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
      },
      body: JSON.stringify({
        email_address: normalizedEmail,
        status_if_new: "subscribed",
        tags: ["Prompt Prophet"],
      }),
    });

    const mailchimpData = await mailchimpResponse.json();

    if (!mailchimpResponse.ok) {
      console.error("Mailchimp API error:", mailchimpData.title, mailchimpData.detail);
      return res.status(400).json({
        error: "We couldn't add that email address. Please try again.",
      });
    }

    console.log("Mailchimp: contact upserted", normalizedEmail, mailchimpData.status);

    // Step 2 — Check if this email already has a count in Redis.
    // If yes, they are a returning user — pass them through with existing count.
    // If no, initialize their count at 0.
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (!kvUrl || !kvToken) {
      // Redis not configured — still let user through, just without server-side tracking
      console.error("Upstash KV environment variables not found — skipping count init");
      return res.status(200).json({ success: true, promptCount: 0 });
    }

    const redisKey = `pp_count:${normalizedEmail}`;

    // Check for existing count first
    const getResponse = await fetch(`${kvUrl}/get/${redisKey}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });

    const getData = await getResponse.json();
    const existingCount = getData.result !== null && getData.result !== undefined
      ? parseInt(getData.result)
      : null;

    if (existingCount !== null) {
      // Returning user — return their existing count
      console.log("Redis: returning user", normalizedEmail, "count:", existingCount);
      return res.status(200).json({ success: true, promptCount: existingCount });
    }

    // New user — initialize count at 0
    await fetch(`${kvUrl}/set/${redisKey}/0`, {
      method: "GET",
      headers: { Authorization: `Bearer ${kvToken}` },
    });

    console.log("Redis: new user initialized", normalizedEmail);
    return res.status(200).json({ success: true, promptCount: 0 });

  } catch (error) {
    console.error("Subscribe unexpected error:", error.message);
    return res.status(500).json({
      error: "Something went wrong. Please try again.",
    });
  }
}

// Pure JavaScript MD5 — no dependencies, works in all Node.js environments.
// Required because Mailchimp identifies members by MD5 hash of lowercase email.
function md5(str) {
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

  const length8 = str.length * 8;
  const l = str.length;
  let i;
  const n = Math.ceil((l + 9) / 64);
  const tail = new Array(n * 16).fill(0);
  for (i = 0; i < l; i++) tail[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  tail[i >> 2] |= 0x80 << ((i % 4) * 8);
  tail[n * 16 - 2] = length8;

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;

  for (i = 0; i < n * 16; i += 16) {
    const aa = a, bb = b, cc = c, dd = d;
    const blk = tail.slice(i, i + 16);

    a = md5ff(a, b, c, d, blk[0], 7, -680876936);
    d = md5ff(d, a, b, c, blk[1], 12, -389564586);
    c = md5ff(c, d, a, b, blk[2], 17, 606105819);
    b = md5ff(b, c, d, a, blk[3], 22, -1044525330);
    a = md5ff(a, b, c, d, blk[4], 7, -176418897);
    d = md5ff(d, a, b, c, blk[5], 12, 1200080426);
    c = md5ff(c, d, a, b, blk[6], 17, -1473231341);
    b = md5ff(b, c, d, a, blk[7], 22, -45705983);
    a = md5ff(a, b, c, d, blk[8], 7, 1770035416);
    d = md5ff(d, a, b, c, blk[9], 12, -1958414417);
    c = md5ff(c, d, a, b, blk[10], 17, -42063);
    b = md5ff(b, c, d, a, blk[11], 22, -1990404162);
    a = md5ff(a, b, c, d, blk[12], 7, 1804603682);
    d = md5ff(d, a, b, c, blk[13], 12, -40341101);
    c = md5ff(c, d, a, b, blk[14], 17, -1502002290);
    b = md5ff(b, c, d, a, blk[15], 22, 1236535329);

    a = md5gg(a, b, c, d, blk[1], 5, -165796510);
    d = md5gg(d, a, b, c, blk[6], 9, -1069501632);
    c = md5gg(c, d, a, b, blk[11], 14, 643717713);
    b = md5gg(b, c, d, a, blk[0], 20, -373897302);
    a = md5gg(a, b, c, d, blk[5], 5, -701558691);
    d = md5gg(d, a, b, c, blk[10], 9, 38016083);
    c = md5gg(c, d, a, b, blk[15], 14, -660478335);
    b = md5gg(b, c, d, a, blk[4], 20, -405537848);
    a = md5gg(a, b, c, d, blk[9], 5, 568446438);
    d = md5gg(d, a, b, c, blk[14], 9, -1019803690);
    c = md5gg(c, d, a, b, blk[3], 14, -187363961);
    b = md5gg(b, c, d, a, blk[8], 20, 1163531501);
    a = md5gg(a, b, c, d, blk[13], 5, -1444681467);
    d = md5gg(d, a, b, c, blk[2], 9, -51403784);
    c = md5gg(c, d, a, b, blk[7], 14, 1735328473);
    b = md5gg(b, c, d, a, blk[12], 20, -1926607734);

    a = md5hh(a, b, c, d, blk[5], 4, -378558);
    d = md5hh(d, a, b, c, blk[8], 11, -2022574463);
    c = md5hh(c, d, a, b, blk[11], 16, 1839030562);
    b = md5hh(b, c, d, a, blk[14], 23, -35309556);
    a = md5hh(a, b, c, d, blk[1], 4, -1530992060);
    d = md5hh(d, a, b, c, blk[4], 11, 1272893353);
    c = md5hh(c, d, a, b, blk[7], 16, -155497632);
    b = md5hh(b, c, d, a, blk[10], 23, -1094730640);
    a = md5hh(a, b, c, d, blk[13], 4, 681279174);
    d = md5hh(d, a, b, c, blk[0], 11, -358537222);
    c = md5hh(c, d, a, b, blk[3], 16, -722521979);
    b = md5hh(b, c, d, a, blk[6], 23, 76029189);
    a = md5hh(a, b, c, d, blk[9], 4, -640364487);
    d = md5hh(d, a, b, c, blk[12], 11, -421815835);
    c = md5hh(c, d, a, b, blk[15], 16, 530742520);
    b = md5hh(b, c, d, a, blk[2], 23, -995338651);

    a = md5ii(a, b, c, d, blk[0], 6, -198630844);
    d = md5ii(d, a, b, c, blk[7], 10, 1126891415);
    c = md5ii(c, d, a, b, blk[14], 15, -1416354905);
    b = md5ii(b, c, d, a, blk[5], 21, -57434055);
    a = md5ii(a, b, c, d, blk[12], 6, 1700485571);
    d = md5ii(d, a, b, c, blk[3], 10, -1894986606);
    c = md5ii(c, d, a, b, blk[10], 15, -1051523);
    b = md5ii(b, c, d, a, blk[1], 21, -2054922799);
    a = md5ii(a, b, c, d, blk[8], 6, 1873313359);
    d = md5ii(d, a, b, c, blk[15], 10, -30611744);
    c = md5ii(c, d, a, b, blk[6], 15, -1560198380);
    b = md5ii(b, c, d, a, blk[13], 21, 1309151649);
    a = md5ii(a, b, c, d, blk[4], 6, -145523070);
    d = md5ii(d, a, b, c, blk[11], 10, -1120210379);
    c = md5ii(c, d, a, b, blk[2], 15, 718787259);
    b = md5ii(b, c, d, a, blk[9], 21, -343485551);

    a = safeAdd(a, aa);
    b = safeAdd(b, bb);
    c = safeAdd(c, cc);
    d = safeAdd(d, dd);
  }

  const result = [a, b, c, d];
  return result.map(n => {
    const hex = [];
    for (let j = 0; j < 4; j++) {
      hex.push(((n >> (j * 8)) & 0xff).toString(16).padStart(2, "0"));
    }
    return hex.join("");
  }).join("");
}
