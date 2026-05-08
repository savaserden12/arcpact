import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { job, dispute } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 500 });
    }

    const prompt = `You are an impartial arbitrator for a decentralized freelance platform called ArcPact.

A dispute has been opened between a client and a provider. Analyze the situation carefully and provide a fair verdict.

JOB DETAILS:
- Title: ${job.title}
- Category: ${job.category}
- Description: ${job.description}
- Budget: ${job.budget} USDC
- Deadline: ${job.deadline}

DISPUTE:
- Client's Reason for Rejection: ${dispute.clientReason}
- Provider's Defense: ${dispute.providerDefense}
${job.ipfsHash ? `- Deliverable File: Available on IPFS (${job.ipfsHash})` : ''}

Respond ONLY with a JSON object, no other text:
{"decision":"approve","reasoning":"explanation here","confidence":85}

decision must be one of: approve, reject, partial
If partial, add "percentage": number between 0-100`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', response.status, err);
      return NextResponse.json({ error: 'Anthropic API failed', status: response.status }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    console.log('AI raw response:', text);

    const clean = text.replace(/```json|```/g, '').trim();
    const verdictData = JSON.parse(clean);

    return NextResponse.json({ ...verdictData, createdAt: new Date().toISOString() });
  } catch (error) {
    console.error('AI verdict error:', error);
    return NextResponse.json({ error: 'Failed to generate verdict' }, { status: 500 });
  }
}