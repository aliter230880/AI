import { Message } from './store';

const SYSTEM_PROMPT = `You are a helpful AI assistant. When writing code, always use proper code blocks with language specification. Be concise but thorough. If the user writes in Russian, respond in Russian.`;

async function callOpenAICompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Message[],
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({ model, messages: apiMessages, stream: false }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `Ошибка API: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(apiKey: string, model: string, messages: Message[]): Promise<string> {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { responseMimeType: 'text/plain' },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg =
      err.error?.message || `Ошибка Gemini API: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function sendMessage(
  provider: string,
  apiKey: string,
  model: string,
  messages: Message[]
): Promise<string> {
  if (provider === 'groq') {
    return callOpenAICompat('https://api.groq.com/openai/v1', apiKey, model, messages);
  }

  if (provider === 'openrouter') {
    return callOpenAICompat('https://openrouter.ai/api/v1', apiKey, model, messages, {
      'HTTP-Referer': window.location.origin,
      'X-Title': 'NovaMind',
    });
  }

  if (provider === 'gemini') {
    return callGemini(apiKey, model, messages);
  }

  throw new Error(`Неизвестный провайдер: ${provider}`);
}
