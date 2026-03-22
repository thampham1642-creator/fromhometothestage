import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is not configured on the server.' },
      { status: 500 }
    )
  }

  try {
    const { question, answer } = await req.json()

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Both question and answer are required.' },
        { status: 400 }
      )
    }

    const prompt = `You are a public speaking coach. The user is practicing English speaking.

Question: "${question}"
User's answer: "${answer}"

Give feedback in the SAME language as the user's answer (if the answer is in Vietnamese, respond in Vietnamese; if English, respond in English).

Structure your response EXACTLY like this:

**Grammar**
[2-3 specific observations about grammar, sentence structure, word choice. Be constructive, not harsh.]

**Ideas**
[2-3 observations about the content: relevance to the question, depth of ideas, structure (STAR, etc.), what was strong and what could improve.]

Keep it concise. Max 150 words total.`

    const groq = new Groq({ apiKey })
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error: any) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
