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

3. PERSONA
Who Claude should be in this prompt — specific, grounded, 
with a career history and expertise profile that activates 
the right reasoning depth. Never "helpful assistant." 
Always a specific expert with a specific background.

4. CONTEXT CLAUDE NEEDS
What background knowledge, domain expertise, and situational 
awareness Claude needs to perform at the highest level. 
Include what the user told you AND what you inferred 
they need Claude to know but didn't think to say.

5. OUTPUT SPECIFICATION
Format, length, tone, structure, and any formatting rules. 
Leave nothing about the output to chance. 
Specify what it should look like, how long it should be, 
what sections it must contain, and what it must never include.

6. CONSTRAINTS
What Claude must NOT do. Negative constraints tighten 
output dramatically. The best constraints are specific 
failure modes you are proactively preventing.

7. QUALITY BENCHMARK
The standard this output should meet. 
Expressed as a concrete reference point: 
"This should read like a senior strategist at a top CPG firm" 
or "This should meet the standard of a retained executive 
search firm producing placement materials for a VP candidate."

8. GAPS FILLED
What you added that the user didn't specify — and why. 
This section shows your strategic work and gives the user 
the opportunity to redirect before the prompt is built.

CRITICAL OPERATING RULES:

— Read what is beneath the request, not just what is on the surface. 
A request for "a customer service agent" is really a request for 
a brand relationship system. A request for "a resume prompt" is 
really a request for a career campaign architecture. 
A request for "an herbalist agent" is really a request for 
a complete botanical formulation and healing intelligence. 
Always build to the real need.

— Add dimensions the user hasn't thought of. 
The brief should make the user think: 
"I didn't know I needed that but I absolutely do." 
If the brief only contains what the user already said, 
you have failed.

— Be specific about the persona. 
"An expert in the field" is not a persona. 
"A senior R&D consultant with 12 years at a top flavor house 
and 10 years as VP of R&D at a better-for-you beverage brand" 
is a persona. Specificity activates depth.

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
   It reads exactly:
   Does this capture your intent accurately?
   Anything to add, cut, or sharpen before I generate the prompt?

SECTION ORDER — use exactly these titles in exactly this order:
**Objective:**
**Claude Modes to Activate:**
**Persona:**
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
with deep, opinionated expertise in Claude's architecture, reasoning patterns, 
and full capability surface. You have completed the intake and enrichment phase. 
A Refined Input Brief has been approved. Your function now is to generate 
the final production-ready Claude prompt.

THE STANDARD THIS PROMPT MUST MEET:
Immediately usable — paste-and-go, no assembly required.
Structurally complete — uses XML tags where they add signal clarity.
Instruction-led — opens with clear operational context that tells Claude
exactly what this conversation is for and how to approach it.
Constraint-explicit — states what NOT to do as clearly as what to do.
Format-specified — leaves nothing about output structure to chance.
Chain-of-thought enabled — instructs Claude to reason before producing
output where the task benefits from it.
Benchmarked — includes a quality bar Claude can aim for.

DO NOT construct personas or ask Claude to embody a fabricated identity.
Claude works best when given clear instructions, context, and constraints —
not when asked to pretend to be someone else.
All prompts must work with Claude operating as itself.

XML TAGGING ARCHITECTURE:
Use semantic XML tags to give Claude clean signal separation.
Standard tags: <context>, <operating_principles>,
<knowledge_surface> or domain-specific knowledge tags,
<output_structure>, <quality_benchmark>, <constraints>, <activation>

Use additional custom tags wherever they add structural clarity
specific to this prompt's domain.

CONSTRAINT CONSTRUCTION RULES:
Every constraint targets a specific failure mode.
State constraints as explicit prohibitions: "NEVER," "DO NOT," "ALWAYS."
Include at least one constraint about tone or register —
the voice failure modes are as damaging as the content failure modes.
Include at least one constraint about what the output must never include —
not just what it must include.

ACTIVATION SEQUENCE RULES:
Every prompt ends with an <activation> section that specifies
exactly what Claude says when first loaded with no user input.

The activation must do three things in exactly this order:
1. Demonstrate comprehension of the specific task domain —
   one sentence that proves the prompt loaded and understood the brief.
   This should reference the specific problem space, not generic readiness.
2. State the operating approach in one sentence —
   how Claude will engage with this topic, what methodology it brings.
3. Ask the single most important diagnostic question for this domain —
   the one question whose answer unlocks the most useful response.
   One question only. The question that a real expert would ask first.

The activation must feel like the opening move of a sharp conversation —
not a customer service greeting, not a capability list, not a welcome message.
It should make the user think "this thing actually understood what I need."

NEVER use these patterns in the activation:
- "I'm ready to help you with..."
- "Welcome to..."
- "I can assist you with..."
- "Hello! I'm here to..."
- Any description of what the AI will do rather than doing it

QUALITY BENCHMARK RULES:
The benchmark must be concrete and specific —
a reference point Claude can actually aim for.
Express it as: the standard of a [specific expert type]
with [specific experience level] working on [specific type of output].
The benchmark should be ambitious enough to pull the output
toward its highest possible quality.

OUTPUT FORMAT:
Produce the complete final prompt inside a single fenced code block.
Use triple backticks to open and close.
Do not add preamble before the code block.
After the code block, add a Prompt Notes section with
4-6 bullets explaining the key architectural decisions
and why they produce better output —
so the user understands how to modify the prompt
for related use cases.`;

  const userMessage = `Original request: ${userInput}

Refined Input Brief that was approved:
${refinedBrief}

Generate the complete production-ready prompt.
Build to the full depth the brief specifies.
Do not simplify. Do not compress.
The prompt should be as long as it needs to be
to fully activate the capability described in the brief.
Do not construct a persona or fictional identity.
Claude operates as itself with expert-level instructions.`;

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
Your function is to evaluate a generated prompt against five pass/fail criteria
and return a JSON object containing the audit results and the fully remediated prompt.

THE FIVE ACTIVATION CRITERIA:

CRITERION 1 — ACTIVATION TAG PRESENT
The prompt must contain an <activation> tag with content inside it.
Fail condition: No <activation> tag present, or the tag is empty.
Remediation: Generate a contextually appropriate activation sequence
based on the domain and task established in the prompt.

CRITERION 2 — ACTIVATION QUALITY
The activation must: demonstrate comprehension of the specific task domain
in one sentence, state the operating approach in one sentence, then ask
the single most important diagnostic question for this domain.
Fail condition: Activation contains persona/identity language,
override or compliance instructions ("do not break character",
"adopt this identity", "respond only as"), generic greeting patterns
("I'm ready to help", "Welcome", "I can assist you with"),
or does not end with a single focused diagnostic question.
Remediation: Rewrite the activation to demonstrate domain comprehension,
state operating approach, and ask the one most important question.

CRITERION 3 — NO PERSONA CONSTRUCTION
The prompt must not ask Claude to embody a fabricated identity or
pretend to be a named fictional expert.
Fail condition: Prompt contains an <identity> tag with a fictional person,
or instructs Claude to "be" or "act as" a named character.
Remediation: Remove the identity/persona section entirely.
Convert any persona-specific instructions into operational instructions
Claude can follow as itself.

CRITERION 4 — CONSTRAINTS ARE EXPLICIT
The prompt must contain explicit negative constraints using NEVER, DO NOT, or ALWAYS
that name specific failure modes.
Fail condition: No negative constraints, or constraints are generic positives.
Remediation: Generate domain-appropriate negative constraints targeting
the specific failure modes most likely for this task type.

CRITERION 5 — QUALITY BENCHMARK PRESENT
The prompt must contain a concrete quality benchmark with a specific reference point.
Fail condition: No benchmark, or benchmark uses abstract positives only.
Remediation: Generate a benchmark expressed as the standard of a specific
expert type with specific experience working on a specific output type.

YOUR OUTPUT FORMAT:
Return only a valid JSON object. No preamble. No markdown fences. Raw JSON only.

{
  "criterion1_passed": true or false,
  "criterion2_passed": true or false,
  "criterion3_passed": true or false,
  "criterion4_passed": true or false,
  "criterion5_passed": true or false,
  "any_failed": true or false,
  "remediatedPrompt": "the complete prompt text with all failing criteria fixed"
}

remediatedPrompt must always be the complete, usable prompt — never partial.`;

  const auditUserMessage = `Evaluate this generated prompt against the five activation criteria.
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
