interface TelegramTemplateOptions {
  rewrittenText: string;
  originalText: string;
  authorName: string | null;
  authorHandle: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount: number | null;
  tweetUrl: string;
  createdAt: Date | string;
  includeStats: boolean;
  includeLink: boolean;
  includeAuthor: boolean;
  includeDate: boolean;
}

/**
 * Build Telegram message from template with placeholders
 */
export function buildTelegramMessage(
  template: string,
  options: TelegramTemplateOptions
): string {
  const {
    rewrittenText,
    originalText,
    authorName,
    authorHandle,
    likeCount,
    retweetCount,
    replyCount,
    viewCount,
    tweetUrl,
    createdAt,
    includeStats,
    includeLink,
    includeAuthor,
    includeDate,
  } = options;

  // Format date
  const formattedDate = formatDate(createdAt);

  // Build placeholders map
  const placeholders: Record<string, string> = {
    "{{rewritten_text}}": rewrittenText,
    "{{original_text}}": originalText,
    "{{author}}": includeAuthor ? (authorName || authorHandle) : "",
    "{{handle}}": includeAuthor ? `@${authorHandle}` : "",
    "{{likes}}": includeStats ? likeCount.toLocaleString() : "",
    "{{retweets}}": includeStats ? retweetCount.toLocaleString() : "",
    "{{comments}}": includeStats ? replyCount.toLocaleString() : "",
    "{{replies}}": includeStats ? replyCount.toLocaleString() : "",
    "{{views}}": includeStats ? (viewCount || 0).toLocaleString() : "",
    "{{link}}": includeLink ? tweetUrl : "",
    "{{url}}": includeLink ? tweetUrl : "",
    "{{date}}": includeDate ? formattedDate : "",
  };

  // Replace all placeholders
  let message = template;
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    message = message.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), value);
  });

  // Clean up empty lines (more than 2 consecutive newlines)
  message = message.replace(/\n{3,}/g, "\n\n");

  // Remove lines that only contain whitespace
  message = message
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, arr) => {
      // Keep non-empty lines
      if (line.length > 0) return true;
      // Keep single empty line between content
      if (index > 0 && index < arr.length - 1 && arr[index - 1] && arr[index + 1]) {
        return true;
      }
      return false;
    })
    .join("\n");

  return message.trim();
}

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return d.toLocaleDateString("en-US", options);
}

/**
 * Get default Telegram template
 */
export function getDefaultTelegramTemplate(): string {
  return `{{rewritten_text}}

✍️ {{author}} ({{handle}})
📊 {{likes}} likes · {{retweets}} retweets · {{comments}} comments
🔗 {{link}}`;
}
