"use client";
import { useEffect, useState } from 'react';
export default function QuestionGenerator() {
  const [sets, setSets] = useState<{ id: number; title: string; description: string }[]>([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
interface SetData {
  title: string;
  description: string;
  id: number;
}
     useEffect(() => {
        fetchData();  ``
      }, []);

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/sets/e5e548d9-813f-49cb-b421-5a15a57887bf');
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        const responseData = await response.json();
        setSets(responseData.sets || []);
      } catch (err) {
        console.error('Failed to fetch sets', err);
        setSets([]);
      } finally {
        setLoading(false);
      }
    };
    
    const handleGenerate = async () => {
      if (!selectedSet) {
        alert('Please select a set');
        return;
      }

      setLoading(true);
      setQuestion('');

      // Abort if stuck for more than 60 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        // Fetch all flashcards and filter for the selected set
        const fcResponse = await fetch('http://localhost:3000/flashcards', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!fcResponse.ok) {
          throw new Error('Failed to fetch flashcards');
        }
        const fcData = await fcResponse.json();
        const allFlashcards = fcData.flashcards || [];
        const flashcards = allFlashcards.filter((f: any) => Number(f.flashcardSetId) === Number(selectedSet));

        if (flashcards.length === 0) {
          setQuestion('No flashcards found for selected set.');
          setLoading(false);
          return;
        }

        // Compose a single long prompt with all flashcards
        const cardsText = flashcards
          .map((f: any, i: number) => `Q${i + 1}: ${f.question}\nA${i + 1}: ${f.answer}`)
          .join('\n\n');

        const prompt = `Here are the flashcards from the selected set:\n\n${cardsText}\n\nUsing the information above, generate a single clear quiz question that tests the material. Output only the question followed by the correct answer on a new line prefixed with "Answer:". Keep the question concise.`;

        // Send to server /chat endpoint which supports streaming
        const response = await fetch('http://localhost:3000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama3.1', messages: [{ role: 'user', content: prompt }], stream: true, temperature: 0.7 }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const txt = await response.text();
          setQuestion('Error: ' + txt);
          setLoading(false);
          return;
        }

        if (!response.body) {
          setQuestion('Error: No response from server');
          setLoading(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let output = '';
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value);
            // Server sends SSE with lines like: data: {...}\n\n
            chunk.split('data: ').forEach((part) => {
              const responseText = part.trim();
              if (!responseText) return;

              try {
                const parsed = JSON.parse(responseText);
                // Extract content from common locations
                const content = parsed?.message?.content ?? parsed?.delta?.content ?? JSON.stringify(parsed);
                output += content;
              } catch (e) {
                // If not JSON, just append raw
                output += responseText;
              }

              // Try to split out the answer if present (format: Question...\nAnswer: ...)
              const match = output.match(/([\s\S]*?)\n\s*Answer:\s*([\s\S]*)/i);
              if (match) {
                const q = match[1].trim();
                const a = match[2].trim();
                setQuestion(q);
                setCorrectAnswer(a.replace(/\n/g, ' ').trim());
              } else {
                setQuestion(output);
              }
            });
          }
        }

        // Ensure we store answer if it arrived late
        if (!correctAnswer) {
          const finalMatch = output.match(/([\s\S]*?)\n\s*Answer:\s*([\s\S]*)/i);
          if (finalMatch) {
            setCorrectAnswer(finalMatch[2].trim().replace(/\n/g, ' ').trim());
            setQuestion(finalMatch[1].trim());
          }
        }

        // Clear previous user's answer & feedback so user starts fresh
        setUserAnswer('');
        setFeedback('');

        setLoading(false);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setQuestion('Error: Request timed out');
        } else {
          setQuestion('Error connecting to server: ' + (err.message ?? err));
        }
        setLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const handleCheck = async () => {
      if (!userAnswer.trim()) {
        alert('Please enter your answer');
        return;
      }
      if (!correctAnswer) {
        alert('No correct answer available. Generate a question first.');
        return;
      }
      setChecking(true);
      setFeedback('');
      try {
        const compPrompt = `Compare the user's answer to the correct answer.\nQuestion: ${question}\nCorrect Answer: ${correctAnswer}\nUser Answer: ${userAnswer}\n\nReply with either "Correct" or "Incorrect". If incorrect, include the correct answer on a line prefixed with "Answer:". Keep it concise.`;
        const resp = await fetch('http://localhost:3000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama3.1', messages: [{ role: 'user', content: compPrompt }], stream: false, temperature: 0.0 }),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          setFeedback('Error: ' + txt);
          setChecking(false);
          return;
        }
        const data = await resp.json();
        setFeedback(data.response || JSON.stringify(data));
      } catch (err: any) {
        setFeedback('Error checking answer: ' + (err.message ?? err));
      } finally {
        setChecking(false);
      }
    };

 return (
    <div className="p-4 max-w-2xl mx-auto min-h-screen bg-black text-white">
      <h1 className="text-xl font-semibold">Flashcard Quiz Generator</h1>

      <label className="block mt-4">
        <span className="text-gray-300">Select a Set</span>
        <select
  value={selectedSet}
  onChange={(e) => setSelectedSet(e.target.value)}
  className="mt-2 p-2 border border-gray-700 rounded w-full bg-gray-800 text-white"
>
  <option value="" className="text-gray-400">-- Select a set --</option>
  {sets.map((set) => (
    <option key={set.id} value={set.id} className="text-black">
      {set.title}
    </option>
  ))}
</select>
      </label>

      <button
        onClick={handleGenerate}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading || !selectedSet}
      >
        {loading ? 'Generating...' : 'Generate Question'}
      </button>

      {question && (
        <>
          <pre className="mt-4 p-4 bg-gray-900 whitespace-pre-wrap border border-gray-700 rounded text-white">
            {question}
          </pre>

          <div className="mt-4">
            <label className="block text-sm text-gray-300">Your Answer</label>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="mt-2 p-2 w-full rounded bg-gray-800 text-white border border-gray-700"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleCheck}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={checking}
              >
                {checking ? 'Checking...' : 'Check Answer'}
              </button>
              <button
                onClick={() => { setUserAnswer(''); setFeedback(''); }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Clear
              </button>
            </div>

            {feedback && (
              <pre className="mt-4 p-4 bg-gray-800 whitespace-pre-wrap border border-gray-700 rounded text-white">
                {feedback}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}
