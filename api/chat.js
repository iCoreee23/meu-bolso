export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, system } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Converte histórico para formato Gemini
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system || 'Você é um assistente financeiro.' }] },
          contents,
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    // Retorna no mesmo formato da Anthropic para o frontend não precisar mudar
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui processar. Tente novamente.';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
