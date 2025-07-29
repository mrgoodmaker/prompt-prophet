import { useState } from 'react';
import { getPromptCount, incrementPromptCount } from '../utils/promptLimit';

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
    setRefinedIntent(data.refinedIntent || 'Something went wrong.');
    setStep(3);
    setLoading(false);
  };

const handlePrompt = async () => {
  const count = getPromptCount();
  if (count >= 10) {
    alert("You've reached your free prompt limit for today (10). Come back tomorrow!");
    return;
  }

  setLoading(true);
  const res = await fetch('/api/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refinedIntent }),
  });
  const data = await res.json();
  setFinalPrompt(data.finalPrompt || 'Prompt generation failed.');
  setStep(4);
  incrementPromptCount(); // Track usage
  setLoading(false);
};

  return (
    <main style={{ maxWidth: 600, margin: 'auto', padding: '2rem' }}>
      <h1>🔮 Prompt Prophet</h1>

      {step === 1 && (
        <>
          <p>Step 1: Your Details</p>
          <input
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
          <input
            placeholder="Your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
          <button onClick={() => setStep(2)} disabled={!name || !email}>
            Next
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p>Step 2: What do you want to achieve?</p>
          <textarea
            placeholder="Describe your goal..."
            value={intent}
            onChange={e => setIntent(e.target.value)}
            style={{ width: '100%', height: 100, marginBottom: 10 }}
          />
          <button onClick={() => setStep(1)}>Back</button>{' '}
          <button onClick={handleRefine} disabled={loading || !intent}>
            {loading ? 'Refining...' : 'Refine'}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <p>Step 3: Confirm Your Refined Intent</p>
          <textarea
            readOnly
            value={refinedIntent}
            style={{ width: '100%', height: 100 }}
          />
          <div style={{ marginTop: 10 }}>
            <button onClick={() => setStep(2)}>Edit</button>{' '}
            <button onClick={handlePrompt} disabled={loading}>
              {loading ? 'Generating...' : 'Looks Good → Generate Prompt'}
            </button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <p>Step 4: Your Copy-Ready Prompt</p>
          <textarea
            readOnly
            value={finalPrompt}
            style={{ width: '100%', height: 150 }}
          />
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(finalPrompt);
                alert('Prompt copied to clipboard!');
              }}
            >
              Copy Prompt
            </button>
            <button onClick={() => setStep(3)} style={{ marginLeft: 10 }}>
              Back
            </button>
            <button onClick={() => window.location.reload()} style={{ marginLeft: 10 }}>
              Make Another
            </button>
          </div>
          <hr style={{ margin: '2rem 0' }} />
          <p style={{ textAlign: 'center' }}>
            🚀 Love your prompt?{' '}
            <a
              href={`https://twitter.com/intent/tweet?text=Just%20used%20Prompt%20Prophet%20to%20refine%20my%20intent%20and%20generate%20a%20perfect%20AI%20prompt!%20Check%20it%20out:%20https://prompt-prophet.vercel.app`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share it on Twitter
            </a>
          </p>
        </>
      )}
    </main>
  );
}
