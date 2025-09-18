import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function llmQuery(question: string, context: any) {
  if (!client) {
    return 'LLM not configured. Set OPENAI_API_KEY to enable LLM answers.';
  }
  const prompt = `You are a drilling optimization assistant. Answer succinctly and with reasoning.\nQuestion: ${question}\nContext: ${JSON.stringify(context).slice(0, 4000)}`;
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert drilling optimization assistant.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  });
  return resp.choices[0]?.message?.content ?? '';
}
