import {NextRequest, NextResponse} from 'next/server';
export async function  POST(req: NextRequest) => {
    const {question, answer} = await req.json();
    const PROMPT_STRING = `Generate 3 plausible but incorrect multiple-choice options. 
    Question: "${question}" 
    Correct answer: "${answer}" 
    Rules:
    - Do NOT include the correct answer
    - Keep answers short
    - Related to the correct answer
    - Output JSON only 
    Format: { "distractors": [""] }`;
    const response =  await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.4,
        messages: [
          { role: "user", content: PROMPT_STRING }
        ]
      })
    });

      const data = await response.json();
      console.log("Mistral status:", response.status);
      console.log("Mistral response:", JSON.stringify(data, null, 2));
      if (!response.ok) {
        console.error("Mistral API error:", data);
        return NextResponse.json(
          { error: data?.message || "Mistral API request failed" },
          { status: response.status }
        );
      }
      
      if (!data?.choices?.[0]?.message?.content) {
        return NextResponse.json(
          { error: "Invalid response from Mistral" },
          { status: 500 }
        );
      }
      const distractors = JSON.parse(data.choices[0].message.content).distractors;

  console.log(distractors);
  return NextResponse.json({distractors});
  }