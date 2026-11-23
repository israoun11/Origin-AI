import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';

export async function generateJson(
  system: string,
  prompt: string,
): Promise<unknown> {
  if (!env.GROQ_API_KEY) {
    throw new ApiError(
      503,
      'The AI Barista is not configured yet. Please try again later.',
    );
  }

  let res: Response;

  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new ApiError(
      503,
      'The AI Barista is unavailable right now. Please try again in a moment.',
    );
  }

  if (!res.ok) {
  const errorText = await res.text();
  console.error('Groq API Error:', res.status, errorText);

  throw new ApiError(
    503,
    'The AI Barista is unavailable right now. Please try again in a moment.',
  );
}

  const data = (await res.json()) as {
    choices?: {
      message?: {
        content?: string | null;
      };
    }[];
  };

  const content = data.choices?.[0]?.message?.content ?? '';

  try {
    return JSON.parse(content);
  } catch {
    throw new ApiError(
      502,
      'The AI Barista returned an unreadable answer. Please regenerate.',
    );
  }
}