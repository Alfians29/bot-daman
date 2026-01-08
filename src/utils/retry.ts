import { Context } from 'grammy';

/**
 * Retry options configuration
 */
interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

/**
 * Check if error is a network error that should trigger retry
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    const networkErrors = [
      'econnaborted',
      'etimedout',
      'enotfound',
      'econnrefused',
      'econnreset',
      'network request failed',
      'socket hang up',
      'fetch failed',
    ];
    return networkErrors.some((e) => errorMessage.includes(e));
  }
  return false;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on network errors
      if (!isNetworkError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        console.error(
          `❌ All ${maxRetries + 1} retry attempts failed for network request`
        );
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.log(
        `⚠️ Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${
          maxRetries + 1
        })...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Reply to context with retry logic
 * @param ctx - Grammy context
 * @param text - Message text
 * @param options - Reply options
 * @returns Message result or null if all retries failed
 */
export async function replyWithRetry(
  ctx: Context,
  text: string,
  options: { parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2' } = {}
): Promise<boolean> {
  try {
    await retryWithBackoff(() => ctx.reply(text, options), {
      maxRetries: 3,
      baseDelay: 1000,
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to send reply after all retries:', error);
    return false;
  }
}
