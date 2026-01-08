import * as fs from 'fs';
import * as path from 'path';
import { Bot } from 'grammy';
import { retryWithBackoff } from './retry';

/**
 * Pending message structure
 */
interface PendingMessage {
  id: string;
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  createdAt: string;
  attempts: number;
}

// Queue file path
const DATA_DIR = path.join(process.cwd(), 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'pending-messages.json');

// In-memory queue
let messageQueue: PendingMessage[] = [];

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Generate unique ID for message
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load queue from file
 */
export function loadQueue(): void {
  try {
    ensureDataDir();
    if (fs.existsSync(QUEUE_FILE)) {
      const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
      messageQueue = JSON.parse(data);
      if (messageQueue.length > 0) {
        console.log(
          `📦 Loaded ${messageQueue.length} pending messages from queue`
        );
      }
    }
  } catch (error) {
    console.error('❌ Failed to load message queue:', error);
    messageQueue = [];
  }
}

/**
 * Save queue to file
 */
export function saveQueue(): void {
  try {
    ensureDataDir();
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(messageQueue, null, 2));
    if (messageQueue.length > 0) {
      console.log(`💾 Saved ${messageQueue.length} pending messages to queue`);
    }
  } catch (error) {
    console.error('❌ Failed to save message queue:', error);
  }
}

/**
 * Add message to queue
 */
export function queueMessage(
  chatId: string,
  text: string,
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
): void {
  const message: PendingMessage = {
    id: generateId(),
    chatId,
    text,
    parseMode,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  messageQueue.push(message);
  saveQueue();
  console.log(
    `📥 Message queued for chat ${chatId} (queue size: ${messageQueue.length})`
  );
}

/**
 * Get queue size
 */
export function getQueueSize(): number {
  return messageQueue.length;
}

/**
 * Process all pending messages in queue
 */
export async function processQueue(bot: Bot): Promise<void> {
  if (messageQueue.length === 0) {
    return;
  }

  console.log(`📤 Processing ${messageQueue.length} pending messages...`);

  const processedIds: string[] = [];
  const failedMessages: PendingMessage[] = [];

  for (const message of messageQueue) {
    try {
      await retryWithBackoff(
        () =>
          bot.api.sendMessage(message.chatId, message.text, {
            parse_mode: message.parseMode,
          }),
        { maxRetries: 2, baseDelay: 1000 }
      );

      processedIds.push(message.id);
      console.log(`✅ Sent queued message to chat ${message.chatId}`);
    } catch (error) {
      message.attempts++;

      // Keep message if under max attempts (5)
      if (message.attempts < 5) {
        failedMessages.push(message);
        console.log(
          `⚠️ Failed to send message to ${message.chatId}, will retry later (attempt ${message.attempts}/5)`
        );
      } else {
        console.error(
          `❌ Message to ${message.chatId} failed after ${message.attempts} attempts, removing from queue`
        );
      }
    }
  }

  // Update queue with only failed messages
  messageQueue = failedMessages;
  saveQueue();

  if (processedIds.length > 0) {
    console.log(`📬 Processed ${processedIds.length} queued messages`);
  }
}

/**
 * Clear the queue (use with caution)
 */
export function clearQueue(): void {
  messageQueue = [];
  saveQueue();
  console.log('🗑️ Message queue cleared');
}
