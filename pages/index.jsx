import { useState } from 'react';

export default function Home() {
  const [intent, setIntent] = useState('');
  const [refinedIntent, setRefinedIntent] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRefinedIntent('');
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

  const handleConfirm = () => {
    alert(`You confirmed: ${refinedIntent}`);
    // Next: Trigger Layer 2 prompt generation here
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Prompt Prophet</h1>

      <form onSubmit={handleSubmit}>
        <label>
          What’s your goal?
          <br />
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
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
            <button onClick={handleConfirm} style={{ marginTop: '1rem' }}>
              Confirm
            </button>
          )}
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
