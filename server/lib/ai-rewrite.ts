import { invokeLLM } from "../_core/llm";

/**
 * Rewrite a tweet using AI based on user's custom prompt
 */
export async function rewriteTweetWithAI(
  originalText: string,
  userPrompt: string
): Promise<string> {
  if (!userPrompt || !userPrompt.trim()) {
    throw new Error("AI rewrite prompt is required");
  }

  const systemPrompt = `You are a professional tweet rewriter. Follow the user's instructions carefully and rewrite the tweet exactly as requested. Only return the rewritten tweet text, nothing else.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${userPrompt}\n\nOriginal tweet:\n${originalText}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI failed to generate rewritten text");
  }

  // Handle both string and array content types
  const rewrittenText = typeof content === 'string' ? content : '';

  if (!rewrittenText) {
    throw new Error("AI returned empty response");
  }

  return rewrittenText.trim();
}
