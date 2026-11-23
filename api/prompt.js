const MAX_PROMPT_LENGTH = 4000;

module.exports = async function handler(req, res) {
  res.setHeader('Allow', 'POST');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Send a POST request.' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'Please provide a prompt.' });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(413).json({ error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.` });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service is not configured. Set OPENAI_API_KEY in the deployment environment.' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a coding assistant. Return only a JSON object with keys summary (string), steps (array of short strings), code (string), and previewHtml (string). Follow the user request. If the task is not about building a web page, explain the approach in summary/steps and use an empty previewHtml. Generated preview HTML must not include scripts, event-handler attributes, iframes, object/embed elements, or external resources. Do not claim to execute code or change files; provide code for review.'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('AI provider error:', upstream.status, data.error?.message || 'Unknown provider error');
      return res.status(502).json({ error: 'The AI provider could not complete the request. Check server logs and provider configuration.' });
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return res.status(502).json({ error: 'The AI provider returned an empty response.' });
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: 'The AI provider response was not valid JSON.' });
    }

    return res.status(200).json({
      summary: typeof result.summary === 'string' ? result.summary : 'Prompt completed.',
      steps: Array.isArray(result.steps) ? result.steps.map(String).slice(0, 20) : [],
      code: typeof result.code === 'string' ? result.code : '',
      previewHtml: typeof result.previewHtml === 'string' ? result.previewHtml : ''
    });
  } catch (error) {
    console.error('Prompt handler error:', error);
    return res.status(500).json({ error: 'The prompt service encountered an unexpected error.' });
  }
};
