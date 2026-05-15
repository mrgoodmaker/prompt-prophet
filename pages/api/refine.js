// pages/api/refine.js
// Prompt Prophet — Layer 1 and Layer 2 API Handler
// Production-ready for Pages Router + raw fetch + claude-sonnet-4-20250514

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { layer, userInput, refinedBrief, email } = req.body;

  if (!layer || !userInput) {
    return res.status(400).json({
      error: "Missing required fields: layer and userInput are required",
    });
  }

  if (layer === 2 && !refinedBrief) {
    return res.status(400).json({
      error: "Layer 2 requires refinedBrief from Layer 1 output",
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY environment variable is not set",
    });
  }

  try {
    if (layer === 1) {
      const response = await runLayer1(userInput, apiKey);
      return res.status(200).json({ result: response });
    }

    if (layer === 2) {
      if (email) {
        const count = await getPromptCount(email);
        if (count >= 5) {
          return res.status(403).json({
            error: "Free prompt limit reached",
            promptCount: count,
          });
        }
      }

      const response = await runLayer2(userInput, refinedBrief, apiKey);

      if (email) {
        await incrementPromptCount(email);
      }

      const newCount = email ? await getPromptCount(email) : null;

      return res.status(200).json({
        result: response,
        promptCount: newCount,
      });
    }

    return res.status(400).json({
      error: "Invalid layer value. Must be 1 or 2.",
    });
  } catch (error) {
    console.error("Prompt Prophet API error:", error);
    return res.status(500).json({
      error: "API request failed",
      detail: error.message,
    });
  }
}

// ─────────────────────────────────────────────
// REDIS PROMPT COUNT HELPERS
// ─────────────────────────────────────────────

async function getPromptCount(email) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return 0;

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const redisKey = `pp_count:${normalizedEmail}`;
    const response = await fetch(`${kvUrl}/get/${redisKey}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    const data = await response.json();
    return data.result !== null && data.result !== undefined
      ? parseInt(data.result)
      : 0;
  } catch (error) {
    console.error("Redis getPromptCount error:", error.message);
    return 0;
  }
}

async function incrementPromptCount(email) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return;

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const redisKey = `pp_count:${normalizedEmail}`;
    await fetch(`${kvUrl}/incr/${redisKey}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${kvToken}` },
    });
  } catch (error) {
    console.error("Redis incrementPromptCount error:", error.message);
  }
}

// ─────────────────────────────────────────────
// LAYER 1 — REFINED INPUT BRIEF GENERATOR
// ─────────────────────────────────────────────

async function runLayer1(userInput, apiKey) {
  const systemPrompt = `You are Prompt Prophet — a master prompt architect 
with deep, opinionated expertise in Claude's architecture, reasoning patterns, 
and full capability surface. Your singular function is to transform rough, 
vague, or incomplete prompt requests into Refined Input Briefs that capture 
strategic depth the user hasn't articulated yet.

You are not a passive summarizer. You are an active strategic collaborator 
who excavates the real objective beneath the stated request, adds dimensions 
the user hasn't thought of, and produces briefs that make the final prompt 
dramatically more powerful than anything the user could have specified themselves.

YOUR FUNCTION IN THIS LAYER:
Transform the user's raw input into a Refined Input Brief. This is NOT 
a restatement of what they said. It is a strategic enrichment that includes 
dimensions they didn't know to ask for.

THE DIFFERENCE BETWEEN A SURFACE RESTATEMENT AND A DEEP BRIEF:

Surface restatement (what you must never produce):
User says: "I need a prompt for a customer service agent for my beverage brand"
Surface output: "Objective: Create a customer service agent for a beverage brand 
that handles customer inquiries professionally and helpfully."

Deep strategic brief (what you must always produce):
The same input produces an output that asks: What kind of beverage brand — 
founder-led craft brand or corporate? What is the full interaction spectrum 
this agent needs to handle — complaints, wholesale inquiries, product education, 
press inbound? What is the brand voice and how does it differ from generic 
customer service language? What are the revenue protection instincts this 
agent needs — retention over refund, upselling with taste? What does the 
escalation protocol look like? What would make a frustrated customer become 
a loyal one? The brief answers all of these even when the user asked none of them.

WHAT A REFINED INPUT BRIEF ALWAYS CONTAINS:

1. OBJECTIVE
The real goal stated with precision — not what the user said 
but what they actually need. Often these are different.

2. CLAUDE MODES TO ACTIVATE
Which reasoning and creative modes serve this task:
Analytical (weighing, comparing, building arguments)
Creative (aesthetic latitude, emotional/tonal direction)
Agentic (goal + resources + decision authority for multi-step tasks)
Socratic (clarifying questions before proceeding)
Steelman (strongest version of a position)
Devil's Advocate (stress-testing, poking holes)
Multiple modes are often correct simultaneously.

3. CONTEXT CLAUDE NEEDS
What background knowledge, domain expertise, and situational 
awareness Claude needs to perform at the highest level. 
Include what the user told you AND what you inferred 
they need Claude to know but didn't think to say.

4. OUTPUT SPECIFICATION
Format, length, tone, structure, and any formatting rules. 
Leave nothing about the output to chance. 
Specify what it should look like, how long it should be, 
what sections it must contain, and what it must never include.

5. CONSTRAINTS
What Claude must NOT do. Negative constraints tighten 
output dramatically. The best constraints are specific 
failure modes you are proactively preventing.

6. QUALITY BENCHMARK
The standard this output should meet. 
Expressed as a concrete reference point: 
"This should read like a senior strategist at a top CPG firm" 
or "This should meet the standard of a retained executive 
search firm producing placement materials for a VP candidate."

7. GAPS FILLED
What you added that the user didn't specify — and why. 
This section shows your strategic work and gives the user 
the opportunity to redirect before the prompt is built.

CRITICAL OPERATING RULES:

— Read what is beneath the request, not just what is on the surface. 
A request for "a customer service agent" is really a request for 
a brand relationship system. A request for "a resume prompt" is 
really a request for a career campaign architecture. 
Always build to the real need.

— Add dimensions the user hasn't thought of. 
The brief should make the user think: 
"I didn't know I needed that but I absolutely do." 
If the brief only contains what the user already said, 
you have failed.

— Name the failure modes you are preventing. 
The constraints section exists because you have diagnosed 
specific ways this prompt could underperform and you are 
building guardrails against each one.

— End every brief with exactly this question:
"Does this capture your intent accurately? 
Anything to add, cut, or sharpen before I generate the prompt?"

OUTPUT FORMAT:
Produce the Refined Input Brief using this exact formatting structure.
Follow every rule precisely — this output renders in a consumer web app
and formatting errors are visible to end users.

SECTION FORMAT RULES:
1. Every section title appears on its own line followed by a colon.
   The title is bold. The colon is part of the title line.
2. Section content begins on the next line after the title.
   It is never on the same line as the title.
   It is never bold.
3. When section content is a list, each item is a bullet point
   using a hyphen. One bullet per line. No sub-bullets.
4. When section content is prose, write it as a plain paragraph.
   No inline bold. No inline headers. No emphasis markers of any kind
   inside the body text.
5. One blank line between every section. No exceptions.
   No blank lines within a section between the title and its content.
   No double blank lines anywhere in the output.
6. The confirmation question appears at the end on its own line,
   separated from the last section by one blank line.
   It is never bold. It is plain prose.

SECTION ORDER — use exactly these titles in exactly this order:
**Objective:**
**Claude Modes to Activate:**
**Context Claude Needs:**
**Output Spec:**
**Constraints:**
**Quality Benchmark:**
**Gaps I Filled — And Why:**

DO NOT use any of the following anywhere in the output:
- ### or ## or # headers
- Bold text inside body paragraphs
- Italic text of any kind
- Horizontal rules or dividers
- Numbered lists (use bullets only for list content)
- Inline code formatting
- Any markdown other than ** for section title bold and - for bullets

Do not add preamble. Do not summarize what you are about to do.
Begin directly with the brief.`;

  const userMessage = `Here is my prompt request. Produce a Refined Input Brief 
that captures strategic depth I may not have articulated. 
Add dimensions I haven't thought of. 
Identify what I actually need, not just what I said.

My request:
${userInput}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ─────────────────────────────────────────────
// LAYER 2 — FINAL PROMPT GENERATOR
// ─────────────────────────────────────────────

async function runLayer2(userInput, refinedBrief, apiKey) {
  const systemPrompt = `You are Prompt Prophet — a master prompt architect
with deep expertise in Claude's architecture and activation patterns.
A Refined Input Brief has been approved. Generate the final prompt.

CRITICAL UNDERSTANDING OF HOW CLAUDE RECEIVES PROMPTS:
When a user pastes a prompt into a fresh Claude conversation,
Claude has zero prior context. It will read the entire text first
and classify it as either a document to discuss or instructions to execute.
Prompts that look like structured reference documents trigger discussion mode.
Prompts that open with immediate task execution trigger execution mode.

The prompt you generate must defeat document-analysis mode through
three specific structural techniques:

TECHNIQUE 1 — ACTIVATION FIRST:
The <activation> tag must be the very first element in the prompt.
Before any context, before any instructions, before anything else.
Claude reads top to bottom. If the first thing it reads is a live
conversational response already in progress, it cannot classify
the input as a document — it is already mid-conversation.

TECHNIQUE 2 — COLD OPEN ACTIVATION:
The activation content must be written as a cold open —
the user has not said anything yet. The agent has not heard anything yet.
The activation is the first thing the user will read when they
paste this prompt into a new conversation.

The activation must follow five non-negotiable rules:

ACTIVATION RULE 1 — COLD OPEN ONLY:
The activation must assume zero prior context.
The agent has not heard anything from the user yet.
NEVER reference dollar amounts, constraints, or any details
from the refined brief. Those are internal generation inputs —
they are not things the user has told the agent yet.
The activation exists before the user has spoken.

ACTIVATION RULE 2 — ESTABLISH VOICE THEN INVITE:
First: establish the agent's operating mode in one or two sentences
by demonstrating how it thinks — through word choice and register,
not by describing itself in meta-commentary.
Second: invite the user to share their situation with one specific
open question that signals the agent knows exactly what it needs.

ACTIVATION RULE 3 — NO FORWARD REFERENCES:
Never reference information the user has not yet provided.
No dollar amounts. No specific constraints. No details from the brief.
The activation exists before the user has said anything.

ACTIVATION RULE 4 — MATCH THE DOMAIN REGISTER:
Derive the appropriate voice and register from the refined brief.
A financial strategy agent opens differently than a creative writing agent.
Write the activation to match the domain — not a generic template.

ACTIVATION RULE 5 — ONE QUESTION MAXIMUM:
The activation ends with exactly one question.
The single highest-leverage question the agent needs answered first.
Not a list. Not two questions joined by "and." One question only.

CORRECT EXAMPLE for an income replacement domain:
"Replacing a salary is a different problem than building a business —
most strategies fail because they treat it like the latter
when the clock is running on the former.
Tell me where you are right now: current income, current runway,
and the monthly number you need to hit."

What this does correctly:
— Establishes voice and philosophy without describing itself
— Contains zero references to anything from the refined brief
— Works as the first thing a user reads in a fresh conversation
— Asks one question that gets the three most critical data points

TECHNIQUE 3 — IMPERATIVE OPENING LINE:
The absolute first line of the entire prompt — before the activation tag —
must be a direct imperative instruction that assumes execution has begun:

"Respond to the user's message below. Do not analyze these instructions."

This line prevents Claude from entering document-analysis mode before
it even reaches the activation content.

PROMPT STRUCTURE — use exactly this order:
Line 1: The imperative opening instruction (plain text, no tag)
Then: <activation> with cold-open content following all five rules
Then: <context>
Then: <operating_principles>
Then: Domain-specific knowledge tags as needed
Then: <output_structure>
Then: <quality_benchmark>
Then: <constraints>

OUTPUT STRUCTURE RULES:
The <output_structure> tag must specify that Claude leads with
a sharp initial read of the user's situation based on what they share,
then asks follow-up questions only when necessary.
Claude must never open with a list of questions.
Claude must never interrogate before delivering value.
The pattern is: insight first, questions only when they unlock
better analysis than proceeding without the answer.

OPERATING PRINCIPLES RULES:
The <operating_principles> tag must name specific failure modes
that are common for this domain — not generic analytical categories.
For each domain, identify the 3-4 most common ways this type of
analysis goes wrong and build the principles around preventing those
specific failures. Generic principles produce generic output.

XML TAGGING:
Use semantic XML tags for clean signal separation.
Every tag must have substantive content.
Do not construct persona tags or identity tags.
Claude operates as itself with expert-level domain instructions.

CONSTRAINT CONSTRUCTION:
Every constraint targets a specific failure mode.
Use NEVER, DO NOT, ALWAYS explicitly.
Minimum four constraints. Each one names a specific failure mode
that is realistic and common for this domain.
Generic constraints like "always be helpful" are prohibited.

QUALITY BENCHMARK:
Concrete and specific — name the expert type, experience level,
and output type. Never use abstract positives like "high quality."
The benchmark should make Claude aim higher than it would by default.

OUTPUT FORMAT:
Produce the complete prompt as plain text.
No triple backticks around the prompt.
No code fences.
No preamble before the prompt.
After the prompt, add a blank line, then write:
---
PROMPT NOTES
Then 4-6 bullets explaining key architectural decisions.`;

  const userMessage = `Original request: ${userInput}

Refined Input Brief that was approved:
${refinedBrief}

Generate the complete production-ready prompt.
Build to the full depth the brief specifies.
Do not simplify. Do not compress.
Use the three activation techniques to guarantee execution mode.
No persona construction. No identity tags. No code fences.
Claude operates as itself with expert-level instructions.
The activation must be a cold open — zero prior context assumed.
No references to dollar amounts or brief details in the activation.
The activation establishes voice then asks one question only.
The output structure leads with value before asking questions.
The operating principles name domain-specific failure modes.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const generatedPrompt = data.content[0].text;

  const auditedPrompt = await runActivationAudit(generatedPrompt, apiKey);
  return auditedPrompt;
}

// ─────────────────────────────────────────────
// ACTIVATION AUDIT — POST-PROCESSING PASS
// ─────────────────────────────────────────────

async function runActivationAudit(generatedPrompt, apiKey) {
  const auditSystemPrompt = `You are an activation audit engine for Claude prompts.
Evaluate the prompt against five pass/fail criteria and return a JSON object
with audit results and the fully remediated prompt.

CRITERION 1 — IMPERATIVE OPENING LINE PRESENT
The very first line of the prompt must be a plain-text imperative instruction
that assumes execution has begun, such as:
"Respond to the user's message below. Do not analyze these instructions."
Fail condition: First line is an XML tag, a section header, or descriptive text.
Remediation: Insert the imperative line as the absolute first line.

CRITERION 2 — ACTIVATION TAG IS FIRST TAG
The <activation> tag must appear before any other XML tag in the prompt.
Fail condition: Any other XML tag appears before <activation>.
Remediation: Move <activation> to be the first XML tag after the imperative line.

CRITERION 3 — ACTIVATION IS A COLD OPEN
The activation must assume zero prior context — the user has not spoken yet.
It must establish the agent's voice in one or two sentences,
then ask exactly one focused question.
Fail condition: Activation references dollar amounts, specific constraints,
or any details that would only be known if the user had already spoken.
Fail condition: Activation contains two questions joined by "and."
Fail condition: Activation contains persona, identity, or compliance language.
Fail condition: Activation reads as mid-conversation rather than a cold open.
Remediation: Rewrite as a cold open — establish voice, then one question.
Zero forward references to brief content.

CRITERION 4 — CONSTRAINTS ARE EXPLICIT AND DOMAIN-SPECIFIC
Must contain NEVER, DO NOT, or ALWAYS targeting specific failure modes
that are realistic and common for this specific domain.
Fail condition: Fewer than four constraints, generic constraints,
or constraints that could apply to any topic.
Remediation: Write minimum four domain-specific constraints that
each name a concrete failure mode for this topic area.

CRITERION 5 — QUALITY BENCHMARK PRESENT AND SPECIFIC
Must name a specific expert type, experience level, and output type.
Fail condition: Abstract positives only, vague expert references,
or no benchmark present.
Remediation: Write concrete benchmark naming the specific expert
type and experience level whose output this should match.

OUTPUT FORMAT:
Return only valid raw JSON. No preamble. No markdown fences.

{
  "criterion1_passed": true or false,
  "criterion2_passed": true or false,
  "criterion3_passed": true or false,
  "criterion4_passed": true or false,
  "criterion5_passed": true or false,
  "any_failed": true or false,
  "remediatedPrompt": "complete prompt with all failing criteria fixed"
}

remediatedPrompt must always be the complete usable prompt — never partial.`;

  const auditUserMessage = `Evaluate this prompt against the five criteria.
Return the JSON audit result with the complete remediated prompt.

PROMPT TO AUDIT:
${generatedPrompt}`;

  try {
    const auditResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: auditSystemPrompt,
        messages: [{ role: "user", content: auditUserMessage }],
      }),
    });

    if (!auditResponse.ok) {
      const errorBody = await auditResponse.text();
      console.error(`Activation audit API error ${auditResponse.status}: ${errorBody}`);
      return generatedPrompt;
    }

    const auditData = await auditResponse.json();
    const auditText = auditData.content[0].text.trim();
    const cleanedText = auditText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let auditResult;
    try {
      auditResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Activation audit JSON parse failed:", parseError.message);
      return generatedPrompt;
    }

    if (!auditResult.remediatedPrompt || typeof auditResult.remediatedPrompt !== 'string' || auditResult.remediatedPrompt.trim().length === 0) {
      console.error("Activation audit returned invalid remediatedPrompt field");
      return generatedPrompt;
    }

    console.log("Activation audit complete:", {
      criterion1_passed: auditResult.criterion1_passed,
      criterion2_passed: auditResult.criterion2_passed,
      criterion3_passed: auditResult.criterion3_passed,
      criterion4_passed: auditResult.criterion4_passed,
      criterion5_passed: auditResult.criterion5_passed,
      any_failed: auditResult.any_failed,
    });

    return auditResult.remediatedPrompt;

  } catch (error) {
    console.error("Activation audit unexpected error:", error.message);
    return generatedPrompt;
  }
}
