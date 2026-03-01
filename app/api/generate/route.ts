import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { question, answer } = await req.json();
  const PROMPT_STRING = `Generate 3 plausible but incorrect multiple-choice options. 
    Question: "${question}" 
    Correct answer: "${answer}" 
    Rules:
    - Do NOT include the correct answer
    - Keep answers short
    - Related to the correct answer
    - Output JSON only 
    Format: { "distractors": [""] }`;

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-small",
      temperature: 0.4,
      messages: [
        { role: "user", content: PROMPT_STRING }
      ]
    })
  });

  const data = await response.json();

  let content = data?.choices?.[0]?.message?.content ?? '';
  if (typeof content !== 'string') content = String(content);
  if (content.includes('```')) {
    content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  }

  const distractors = JSON.parse(content).distractors;

  return NextResponse.json({ distractors });
}
