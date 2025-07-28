import { useState } from 'react';

export default function Home() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [intent, setIntent] = useState('');
  const [refined, setRefined] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRefine = async () => {
    setLoading(true);
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent }),
    });
    const data = await res.json();
    setRefined(data.refinedIntent);
    setLoading(false);
    setStep(3);
  };

  const handlePrompt = async () => {
    setLoading(true);
    const res = await fetch('/api/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refinedIntent: refined }),
    });
    const data = await res.json();
    setPrompt(data.prompt);
    setLoading(false);
    setStep(4);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>🔮 Prompt Prophet</h1>

      {step === 1 && (
        <>
          <p>Enter your name and email to begin your ritual.</p>
          <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', marginBottom: '1rem' }} />
          <input placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', marginBottom: '1rem' }} />
          <button onClick={() => setStep(2)}>Continue</button>
        </>
      )}

      {step === 2 && (
        <>
          <p>What do you seek?</p>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Type your goal or desire here..."
            style={{ width: '100%', height: '120px', marginBottom: '1rem' }}
          />
          <button onClick={handleRefine} disabled={loading}>
            {loading ? 'Reflecting...' : 'Reflect My Intent'}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <p><strong>Refined Intent:</strong></p>
          <blockquote style={{ background: '#eee', padding: '1rem', borderRadius: '8px' }}>{refined}</blockquote>
          <p>Is this accurate?</p>
          <button onClick={handlePrompt} disabled={loading} style={{ marginRight: '1rem' }}>
            Yes, generate my prompt
          </button>
          <button onClick={() => setStep(2)}>No, edit intent</button>
        </>
      )}

      {step === 4 && (
        <>
          <p><strong>Your Perfect Prompt:</strong></p>
          <textarea readOnly value={prompt} style={{ width: '100
