import { Bot } from 'grammy';
/**
 * Load queue from file
 */
export declare function loadQueue(): void;
/**
 * Save queue to file
 */
export declare function saveQueue(): void;
/**
 * Add message to queue
 */
export declare function queueMessage(chatId: string, text: string, parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'): void;
/**
 * Get queue size
 */
export declare function getQueueSize(): number;
/**
 * Process all pending messages in queue
 */
export declare function processQueue(bot: Bot): Promise<void>;
/**
 * Clear the queue (use with caution)
 */
export declare function clearQueue(): void;
//# sourceMappingURL=messageQueue.d.ts.map