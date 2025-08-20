import { useState, useEffect } from 'react';
import { getPromptCount, incrementPromptCount } from '../utils/promptLimit';

export default function Home() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [intent, setIntent] = useState('');
  const [refinedIntent, setRefinedIntent] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // 🔥 Toast state

  // Auto-hide toast after 3s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message) => {
    setToast(message);
  };

  const handleRefine = async () => {
    setLoading(true);

    // 1. Log to Airtable
    const logRes = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, intent }),
    });
    const logData = await logRes.json();
    showToast("✅ Your intent was logged successfully!");

    // 2. Continue refinement
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
      showToast("⚠️ Free prompt limit reached (10/day). Upgrade for unlimited.");
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
    incrementPromptCount();
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 600, margin: 'auto', padding: '2rem' }}>
      <h1>🔮 Prompt Prophet</h1>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#333',
          color: '#fff',
          padding: '10px 15px',
          borderRadius: '5px',
          zIndex: 9999
        }}>
          {toast}
        </div>
      )}

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
                showToast('📋 Prompt copied to clipboard!');
              }}
            >
              Copy Prompt
            </button>
            <button onClick={() => setStep(3)} style={{ marginLeft: 10 }}>
              Back
            </button>
            <button onClick={() => setStep(2)} style={{ marginLeft: 10 }}>
              Refine Again
            </button>
            <button onClick={() => window.location.reload()} style={{ marginLeft: 10 }}>
              Make Another
            </button>
          </div>
        </>
      )}
    </main>
  );
}