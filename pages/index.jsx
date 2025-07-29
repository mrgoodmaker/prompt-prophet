import { useState } from 'react';

export default function Home() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [intent, setIntent] = useState('');
  const [refinedIntent, setRefinedIntent] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRefine = async () => {
    setLoading(true);
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, intent }),
    });
    const data = await res.json();
    setRefinedIntent(data.refinedIntent);
    setStep(3);
    setLoading(false);
  };

  const handlePrompt = async () => {
    setLoading(true);
    const res = await fetch('/api/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refinedIntent }),
    });
    const data = await res.json();
    setFinalPrompt(data.finalPrompt);
    setStep(4);
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 600, margin: 'auto', padding: '2rem' }}>
      <h1>🔮 Prompt Prophet</h1>

      {step === 1 && (
        <>
          <p>Step 1: Tell us who you are</p>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
          <input placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
          <button onClick={() => setStep(2)}>Next</button>
        </>
      )}

      {step === 2 && (
        <>
          <p>Step 2: What are you trying to achieve?</p>
          <textarea
            placeholder="Describe your goal or idea..."
            value={intent}
            onChange={e => setIntent(e.target.value)}
            style={{ width: '100%', height: 100, marginBottom: 10 }}
          />
          <button onClick={handleRefine} disabled={loading}>
            {loading ? 'Refining...' : 'Refine My Intent'}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <p>Step 3: Refined Intent (Layer 1)</p>
          <textarea readOnly value={refinedIntent} style={{ width: '100%', height: 100 }} />
          <div style={{ marginTop: 10 }}>
            <button onClick={() => setStep(2)}>Edit</button>
            <button onClick={handlePrompt} disabled={loading} style={{ marginLeft: 10 }}>
              {loading ? 'Generating...' : 'Looks Good → Generate My Prompt'}
            </button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <p>Step 4: Your Perfect Prompt (Layer 2)</p>
          <textarea readOnly value={finalPrompt} style={{ width: '100%', height: 150 }} />
          <button
            onClick={() => {
              navigator.clipboard.writeText(finalPrompt);
              alert('Prompt copied to clipboard!');
            }}
            style={{ marginTop: 10 }}
          >
            Copy to Clipboard
          </button>
        </>
      )}
    </main>
  );
}
