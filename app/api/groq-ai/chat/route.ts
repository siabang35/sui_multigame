import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are a helpful AI assistant for a blockchain-based 3D multiplayer game called MULTIPLY. 
You provide game tips, strategies, guides, and help players understand the game mechanics.

Game Features:
- Fast-paced 3D arena combat
- Blockchain-based player progression
- Multiple abilities with cooldowns
- Leaderboard rankings
- Player vs Player (PvP) gameplay
- NFT-based asset system

Be concise, helpful, and engaging. Keep responses under 200 characters when possible.
Provide strategic advice, answer questions about mechanics, and encourage gameplay.`;

export async function POST(request: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Groq API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body: RequestBody = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid message format' },
        { status: 400 }
      );
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message.slice(0, 500) }, // Limit input length
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 256,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[v0] Groq API error:', errorData);
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from Groq API');
    }

    const aiMessage = data.choices[0].message.content.trim();

    return NextResponse.json({
      success: true,
      message: aiMessage,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[v0] Chat API error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
