/**
 * Rewrite a tweet using OpenRouter AI based on user's custom prompt and model settings
 */

interface OpenRouterConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export async function rewriteTweetWithOpenRouter(
  originalText: string,
  userPrompt: string,
  config: OpenRouterConfig
): Promise<string> {
  if (!config.apiKey || !config.apiKey.trim()) {
    throw new Error("OpenRouter API key is required. Please add it in Settings.");
  }

  if (!userPrompt || !userPrompt.trim()) {
    throw new Error("AI rewrite prompt is required");
  }

  const systemPrompt = `You are a professional tweet rewriter. Follow the user's instructions carefully and rewrite the tweet exactly as requested. Only return the rewritten tweet text, nothing else.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://ai-twitter-monitor.manus.space',
        'X-Title': 'AI Twitter Monitor',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `${userPrompt}\n\nOriginal tweet:\n${originalText}`,
          },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI failed to generate rewritten text");
    }

    const rewrittenText = typeof content === 'string' ? content : '';

    if (!rewrittenText.trim()) {
      throw new Error("AI returned empty response");
    }

    return rewrittenText.trim();
  } catch (error: any) {
    if (error.message.includes('OpenRouter API error')) {
      throw error;
    }
    throw new Error(`Failed to rewrite tweet: ${error.message}`);
  }
}
