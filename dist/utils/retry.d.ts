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
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Result of the function
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Reply to context with retry logic
 * @param ctx - Grammy context
 * @param text - Message text
 * @param options - Reply options
 * @returns Message result or null if all retries failed
 */
export declare function replyWithRetry(ctx: Context, text: string, options?: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}): Promise<boolean>;
export {};
//# sourceMappingURL=retry.d.ts.map