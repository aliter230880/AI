import { Message } from "./store";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a helpful AI assistant. When writing code, always use proper code blocks with language specification. Be concise but thorough. If the user writes in Russian, respond in Russian.`;

export async function sendMessageToGroq(
  apiKey: string,
  model: string,
  messages: Message[]
): Promise<string> {
  const apiMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API Error:", error);
    throw error;
  }
}
