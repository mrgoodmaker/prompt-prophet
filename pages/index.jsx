import { useState } from 'react';

export default function Home() {
  const [intent, setIntent] = useState('');
  const [refinedIntent, setRefinedIntent] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRefinedIntent('');
    setFinalPrompt('');
    setShowConfirm(false);

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intent }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to refine intent.');
      }

      setRefinedIntent(data.refinedIntent);
      setShowConfirm(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    setFinalPrompt('');

    try {
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refinedIntent }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Confirmation failed.');
      }

      setFinalPrompt(data.finalPrompt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Prompt Prophet — Test Build</h1>

      <form onSubmit={handleSubmit}>
        <label>
          What’s your goal?
          <br />
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.5rem',
              fontSize: '16px',
            }}
          />
        </label>
        <br /><br />
        <button type="submit" disabled={loading}>
          {loading ? 'Refining...' : 'Submit'}
        </button>
      </form>

      {refinedIntent && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Refined Intent:</h3>
          <p>{refinedIntent}</p>

          {showConfirm && (
            <button onClick={handleConfirm} disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Generating Final Prompt...' : 'Confirm'}
            </button>
          )}
        </div>
      )}

      {finalPrompt && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Final Master Prompt:</h3>
          <pre
            style={{
              background: '#f4f4f4',
              padding: '1rem',
              borderRadius: '5px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {finalPrompt}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(finalPrompt)}
            style={{ marginTop: '1rem' }}
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
