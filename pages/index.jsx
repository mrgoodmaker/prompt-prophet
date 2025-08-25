import { useState } from 'react';

export default function Home() {
  const [goal, setGoal] = useState('');
  const [refinedIntent, setRefinedIntent] = useState('');
  const [masterPrompt, setMasterPrompt] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal }),
    });
    const data = await res.json();
    setRefinedIntent(data.refinedIntent);
    setMasterPrompt(data.masterPrompt);
    setConfirmed(false);
  };

  const handleConfirm = () => setConfirmed(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(masterPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(`Just generated this with Prompt Prophet — build better prompts faster. 🚀
Try it now: https://prompt-prophet.vercel.app`);

  return (
    <main className="min-h-screen px-6 py-12 bg-white text-gray-900 font-sans max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🔮 Prompt Prophet</h1>

      <label className="block mb-2 text-lg font-medium">🧠 What would you like to create with AI?</label>
      <input
        className="w-full p-3 border border-gray-300 rounded-md mb-4 text-lg"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="e.g., Create a viral tweet thread generator"
      />
      <button
        onClick={handleSubmit}
        className="bg-green-800 text-white py-2 px-6 rounded-md hover:bg-green-900 transition"
      >
        Submit
      </button>

      {refinedIntent && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">✨ Here's your refined version</h2>
          <p className="bg-gray-100 p-4 rounded-md border">{refinedIntent}</p>
          {!confirmed && (
            <button
              onClick={handleConfirm}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Confirm
            </button>
          )}
        </div>
      )}

      {confirmed && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">🎯 Use this optimized prompt</h2>
          <pre className="bg-gray-100 p-4 rounded-md border text-sm whitespace-pre-wrap">{masterPrompt}</pre>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleCopy}
              className="bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900"
            >
              📋 Copy Prompt
            </button>
            {copied && <span className="text-green-600 font-medium">✅ Copied!</span>}
          </div>

          <div className="mt-6 text-sm text-gray-700">Share your creation:</div>
          <div className="flex gap-4 mt-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              🔁 Share on X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=https://prompt-prophet.vercel.app`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline"
            >
              💼 Share on LinkedIn
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=https://prompt-prophet.vercel.app`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              📘 Share to Facebook
            </a>
          </div>
        </div>
      )}

      <footer className="mt-20 border-t pt-8 text-sm text-center text-gray-500">
        <p>
          Want more tools like this? <strong>Join the waitlist for Prompt Prophet Pro</strong>
        </p>
        <form
          className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            // Placeholder logic for email capture
            alert('Thanks! You’re on the waitlist.');
          }}
        >
          <input
            type="email"
            placeholder="Your email"
            className="p-2 border rounded-md w-64"
            required
          />
          <button
            type="submit"
            className="bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800"
          >
            Notify Me
          </button>
        </form>
      </footer>
    </main>
  );
}
