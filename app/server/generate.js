import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model = 'deepseek-r1', stream = false } = req.body;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model,
      prompt,
      stream,
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error calling Ollama:', error.message);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
