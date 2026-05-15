import { useState } from 'react';
import Head from 'next/head';

const FREE_LIMIT = 5;

export default function Home() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [refinedIntent, setRefinedIntent] = useState('');
  const [seedPrompt, setSeedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promptCount, setPromptCount] = useState(0);

  const isAtLimit = promptCount >= FREE_LIMIT;

  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes('@') || emailLoading) return;
    setEmailLoading(true);
    setEmailError('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        // Load their server-side count — works for new and returning users
        setPromptCount(data.promptCount || 0);
        setStep('input');
      } else {
        setEmailError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (e) {
      setEmailError('Something went wrong. Please try again.');
    }
    setEmailLoading(false);
  };

  const handleRefine = async () => {
    if (!userInput.trim() || loading || isAtLimit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layer: 1, userInput, email }),
      });
      const data = await res.json();
      setRefinedIntent(data.result);
      setStep('confirm');
    } catch (e) {
      alert('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setStep('invisible');
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layer: 2, userInput, refinedBrief: refinedIntent, email }),
      });
      const data = await res.json();

      if (res.status === 403) {
        // Limit reached server-side
        setPromptCount(FREE_LIMIT);
        setStep('input');
        setLoading(false);
        return;
      }

      setSeedPrompt(data.result);

      // Use server-returned count if available, otherwise increment local
      if (data.promptCount !== null && data.promptCount !== undefined) {
        setPromptCount(data.promptCount);
      } else {
        setPromptCount(prev => prev + 1);
      }

      setStep('result');
    } catch (e) {
      alert('Something went wrong. Please try again.');
      setStep('confirm');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    // Strip any residual code fence markers before copying
    // so the prompt pastes as raw instructions, not quoted code
    const cleanPrompt = seedPrompt
      .replace(/^```[\w]*\n?/gm, '')
      .replace(/^```\n?/gm, '')
      .trim();
    navigator.clipboard.writeText(cleanPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setStep('input');
    setUserInput('');
    setRefinedIntent('');
    setSeedPrompt('');
    setCopied(false);
  };

  const handleEdit = () => {
    setStep('input');
    setRefinedIntent('');
    setSeedPrompt('');
  };

  const progressSteps = ['input', 'confirm', 'invisible', 'result'];
  const currentStepIndex = progressSteps.indexOf(step);

  return (
    <>
      <Head>
        <title>Prompt Prophet — Get More From AI</title>
        <meta name="description" content="Stop getting mediocre AI results. Prompt Prophet's P.I.E. engine turns what you want into a precision prompt that works." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.page}>
        {/* NAV */}
        <nav style={styles.nav}>
          <div style={styles.navLogo}>
            Prompt <span style={styles.navLogoEm}>Prophet</span>
          </div>
          <div style={styles.navRight}>
            {step !== 'email' && (
              <span style={styles.navCounter}>
                {isAtLimit ? '⚡ Upgrade for unlimited' : `${FREE_LIMIT - promptCount} free prompts remaining`}
              </span>
            )}
            <a href="https://goodcompanion.ai" style={styles.navBadge}>
              🌿 Good Companion
            </a>
          </div>
        </nav>

        <main style={styles.main}>

          {/* STEP: EMAIL GATE */}
          {step === 'email' && (
            <>
              <div style={styles.hero}>
                <p style={styles.eyebrow}>P.I.E. — Prompt Inception Engine</p>
                <h1 style={styles.heroTitle}>
                  You know what you want.<br />
                  Now <em style={styles.heroEm}>get it</em> from AI.
                </h1>
                <p style={styles.heroSub}>
                  Tell Prophet what you're trying to accomplish. In plain language. No special knowledge required.
                </p>
              </div>
              <div style={styles.card}>
                <p style={styles.cardLabel}>GET STARTED — FREE</p>
                <p style={styles.cardHint}>
                  Enter your email to access Prompt Prophet. Already used it before? Same email gets you right back in.
                </p>
                <input
                  type="email"
                  style={styles.input}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSubmit(); }}
                  disabled={emailLoading}
                />
                {emailError && (
                  <p style={styles.errorText}>{emailError}</p>
                )}
                <div style={styles.inputActions}>
                  <button
                    style={{
                      ...styles.btnPrimary,
                      opacity: emailLoading || !email.trim() ? 0.6 : 1,
                      cursor: emailLoading || !email.trim() ? 'not-allowed' : 'pointer',
                    }}
                    onClick={handleEmailSubmit}
                    disabled={emailLoading || !email.trim()}
                  >
                    {emailLoading ? 'One moment...' : 'Access Prompt Prophet →'}
                  </button>
                </div>
                <p style={styles.privacyNote}>
                  No spam. No password. Just your email to get started.
                </p>
              </div>
              <div style={styles.doctrineRow}>
                <div style={styles.doctrinePill}>🧠 Cognitive Sovereignty</div>
                <div style={styles.doctrinePill}>🌿 Regenerative by Design</div>
                <div style={styles.doctrinePill}>✦ Benefit of All</div>
              </div>
            </>
          )}

          {/* HERO — only show on input step */}
          {step === 'input' && (
            <div style={styles.hero}>
              <p style={styles.eyebrow}>P.I.E. — Prompt Inception Engine</p>
              <h1 style={styles.heroTitle}>
                You know what you want.<br />
                Now <em style={styles.heroEm}>get it</em> from AI.
              </h1>
              <p style={styles.heroSub}>
                Tell Prophet what you're trying to accomplish. In plain language. No special knowledge required.
              </p>
            </div>
          )}

          {/* PROGRESS BAR */}
          {step !== 'email' && step !== 'input' && (
            <div style={styles.progressWrap}>
              {['Capture', 'Confirm', 'Crafting', 'Ready'].map((label, i) => (
                <div key={label} style={styles.progressItem}>
                  <div style={{
                    ...styles.progressDot,
                    background: i <= currentStepIndex ? '#B87333' : '#E4DBCF',
                  }} />
                  <span style={{
                    ...styles.progressLabel,
                    color: i <= currentStepIndex ? '#B87333' : '#A89F96',
                    fontWeight: i === currentStepIndex ? '500' : '400',
                  }}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* CARD — all steps except email */}
          {step !== 'email' && (
            <div style={styles.card}>

              {/* STEP: INPUT */}
              {step === 'input' && (
                <div>
                  <p style={styles.cardLabel}>LAYER 01 — INTENT CAPTURE</p>
                  <p style={styles.cardHint}>
                    What are you trying to accomplish? Describe it in your own words — rough, detailed, anywhere in between.
                  </p>
                  <textarea
                    style={styles.textarea}
                    placeholder="E.g. I want to write a cold email to a potential investor for my startup but I don't know how to make it compelling without being pushy..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey) handleRefine();
                    }}
                    rows={5}
                    disabled={isAtLimit}
                  />
                  {isAtLimit ? (
                    <div style={styles.limitBox}>
                      <p style={styles.limitTitle}>You've used your {FREE_LIMIT} free prompts.</p>
                      <p style={styles.limitSub}>Upgrade to Pro for unlimited access — $15/month.</p>
                      <button style={styles.btnPrimary}>Upgrade to Pro →</button>
                    </div>
                  ) : (
                    <div style={styles.inputActions}>
                      <button
                        style={{
                          ...styles.btnPrimary,
                          opacity: loading || !userInput.trim() ? 0.6 : 1,
                          cursor: loading || !userInput.trim() ? 'not-allowed' : 'pointer',
                        }}
                        onClick={handleRefine}
                        disabled={loading || !userInput.trim()}
                      >
                        {loading ? 'Prophet is thinking...' : 'Refine My Intent →'}
                      </button>
                      <p style={styles.inputHint}>⌘ + Enter to submit</p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: CONFIRM */}
              {step === 'confirm' && (
                <div>
                  <p style={styles.cardLabel}>LAYER 01 — DOES THIS CAPTURE YOUR INTENT?</p>
                  <p style={styles.cardHint}>
                    Prophet has refined what you described. Read this carefully — confirm it's right before we go deeper.
                  </p>
                  <div style={styles.refinedBox}>
                    {refinedIntent.split('\n').map((line, i) => {
                      if (line.trim() === '') return <br key={i} />;
                      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      if (line.startsWith('- ')) {
                        return <li key={i} style={{ fontSize: '14px', color: '#1A1A18', lineHeight: '1.6', marginLeft: '16px', marginBottom: '4px', listStyleType: 'disc' }}>{line.slice(2)}</li>;
                      }
                      return <p key={i} style={line.startsWith('**') ? { fontSize: '13px', fontWeight: '600', color: '#B87333', letterSpacing: '0.05em', marginBottom: '4px', marginTop: '16px' } : { fontSize: '15px', color: '#1A1A18', lineHeight: '1.65', marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: boldLine }} />;
                    })}
                  </div>
                  <div style={styles.confirmActions}>
                    <button style={styles.btnPrimary} onClick={handleConfirm} disabled={loading}>
                      {loading ? 'Building your prompt...' : "Yes, that's it — Generate My Prompt →"}
                    </button>
                    <button style={styles.btnSecondary} onClick={handleEdit}>
                      ← Let me adjust
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: INVISIBLE LAYER */}
              {step === 'invisible' && (
                <div style={styles.invisibleWrap}>
                  <div style={styles.invisibleInner}>
                    <div style={styles.orbWrap}>
                      <div style={styles.orb} />
                    </div>
                    <p style={styles.invisibleLabel}>LAYER 02 — EXPERT ARCHITECTURE</p>
                    <p style={styles.invisibleTitle}>Prophet is working.</p>
                    <p style={styles.invisibleSub}>
                      This layer is invisible by design. Expert prompt architecture is being applied to your intent. You'll feel the result — not see the process.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP: RESULT */}
              {step === 'result' && (
                <div>
                  <p style={styles.cardLabel}>LAYER 03 — YOUR PRECISION PROMPT</p>
                  <p style={styles.cardHint}>
                    This prompt is engineered to get you the best possible result from any AI tool. Copy it and paste it directly into ChatGPT, Claude, Gemini — anywhere.
                  </p>
                  <div style={styles.resultBox}>
                    <pre style={styles.resultText}>{seedPrompt}</pre>
                  </div>
                  <div style={styles.resultActions}>
                    <button style={styles.btnPrimary} onClick={handleCopy}>
                      {copied ? '✓ Copied to clipboard' : 'Copy Prompt'}
                    </button>
                    <button style={styles.btnSecondary} onClick={handleReset}>
                      Start a new prompt
                    </button>
                  </div>
                  <div style={styles.shareRow}>
                    <p style={styles.shareText}>
                      🌿 Built by <a href="https://goodcompanion.ai" style={styles.shareLink}>Good Companion</a> — AI that makes you more yourself.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F8F4EE',
    fontFamily: "'DM Sans', sans-serif",
    color: '#1A1A18',
  },
  nav: {
    position: 'fixed',
    top: 0,
    width: '100%',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(248,244,238,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #E4DBCF',
    zIndex: 100,
    boxSizing: 'border-box',
  },
  navLogo: {
    fontFamily: "'Lora', serif",
    fontSize: '18px',
    fontWeight: '500',
    color: '#1A1A18',
  },
  navLogoEm: {
    color: '#B87333',
    fontStyle: 'italic',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navCounter: {
    fontSize: '13px',
    color: '#A89F96',
  },
  navBadge: {
    fontSize: '12px',
    color: '#1E3A2F',
    background: '#EDE6DC',
    padding: '6px 12px',
    borderRadius: '100px',
    textDecoration: 'none',
    fontWeight: '500',
  },
  main: {
    maxWidth: '680px',
    margin: '0 auto',
    padding: '120px 24px 80px',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  eyebrow: {
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#B87333',
    marginBottom: '20px',
  },
  heroTitle: {
    fontFamily: "'Lora', serif",
    fontSize: 'clamp(36px, 6vw, 58px)',
    fontWeight: '500',
    lineHeight: '1.12',
    letterSpacing: '-0.025em',
    color: '#1A1A18',
    marginBottom: '20px',
  },
  heroEm: {
    color: '#B87333',
    fontStyle: 'italic',
  },
  heroSub: {
    fontSize: '18px',
    fontWeight: '300',
    color: '#6B6258',
    lineHeight: '1.65',
    maxWidth: '480px',
    margin: '0 auto',
  },
  progressWrap: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '32px',
  },
  progressItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  progressDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'background 0.3s',
  },
  progressLabel: {
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transition: 'color 0.3s',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E4DBCF',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 4px 32px rgba(184,115,51,0.06)',
  },
  cardLabel: {
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#B87333',
    marginBottom: '12px',
  },
  cardHint: {
    fontSize: '15px',
    color: '#6B6258',
    lineHeight: '1.6',
    marginBottom: '20px',
    fontWeight: '300',
  },
  input: {
    width: '100%',
    padding: '16px',
    border: '1.5px solid #E4DBCF',
    borderRadius: '12px',
    background: '#FDF9F3',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
    color: '#1A1A18',
    lineHeight: '1.6',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    marginBottom: '8px',
  },
  textarea: {
    width: '100%',
    padding: '16px',
    border: '1.5px solid #E4DBCF',
    borderRadius: '12px',
    background: '#FDF9F3',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
    color: '#1A1A18',
    lineHeight: '1.6',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  inputActions: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  inputHint: {
    fontSize: '12px',
    color: '#A89F96',
  },
  errorText: {
    fontSize: '13px',
    color: '#C0392B',
    marginTop: '4px',
    marginBottom: '4px',
  },
  privacyNote: {
    fontSize: '12px',
    color: '#A89F96',
    marginTop: '16px',
    textAlign: 'center',
  },
  btnPrimary: {
    background: '#B87333',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '100px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 16px rgba(184,115,51,0.3)',
  },
  btnSecondary: {
    background: 'transparent',
    color: '#1E3A2F',
    border: '1.5px solid #1E3A2F',
    padding: '13px 24px',
    borderRadius: '100px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  refinedBox: {
    background: '#FDF9F3',
    border: '1.5px solid #F0DFC0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  invisibleWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 0',
  },
  invisibleInner: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  orbWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '28px',
  },
  orb: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #D4924A, #B87333, #1E3A2F)',
    boxShadow: '0 16px 48px rgba(184,115,51,0.4)',
    animation: 'orbPulse 2s ease-in-out infinite',
  },
  invisibleLabel: {
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#B87333',
    marginBottom: '12px',
  },
  invisibleTitle: {
    fontFamily: "'Lora', serif",
    fontSize: '28px',
    fontWeight: '500',
    color: '#1A1A18',
    marginBottom: '12px',
  },
  invisibleSub: {
    fontSize: '14px',
    color: '#6B6258',
    lineHeight: '1.65',
    fontWeight: '300',
  },
  resultBox: {
    background: '#FDF9F3',
    border: '1.5px solid #F0DFC0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    maxHeight: '320px',
    overflowY: 'auto',
  },
  resultText: {
    fontSize: '14px',
    color: '#1A1A18',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
    fontFamily: "'DM Sans', sans-serif",
    margin: 0,
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  shareRow: {
    borderTop: '1px solid #E4DBCF',
    paddingTop: '16px',
  },
  shareText: {
    fontSize: '13px',
    color: '#A89F96',
    textAlign: 'center',
  },
  shareLink: {
    color: '#B87333',
    textDecoration: 'none',
  },
  limitBox: {
    background: '#FDF9F3',
    border: '1px solid #E4DBCF',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    marginTop: '16px',
  },
  limitTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#1A1A18',
    marginBottom: '8px',
  },
  limitSub: {
    fontSize: '14px',
    color: '#6B6258',
    marginBottom: '16px',
  },
  doctrineRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '40px',
    flexWrap: 'wrap',
  },
  doctrinePill: {
    fontSize: '12px',
    color: '#1E3A2F',
    background: '#EDE6DC',
    padding: '6px 14px',
    borderRadius: '100px',
    fontWeight: '500',
  },
};
