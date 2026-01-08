"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadQueue = loadQueue;
exports.saveQueue = saveQueue;
exports.queueMessage = queueMessage;
exports.getQueueSize = getQueueSize;
exports.processQueue = processQueue;
exports.clearQueue = clearQueue;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const retry_1 = require("./retry");
// Queue file path
const DATA_DIR = path.join(process.cwd(), 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'pending-messages.json');
// In-memory queue
let messageQueue = [];
/**
 * Ensure data directory exists
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}
/**
 * Generate unique ID for message
 */
function generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Load queue from file
 */
function loadQueue() {
    try {
        ensureDataDir();
        if (fs.existsSync(QUEUE_FILE)) {
            const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
            messageQueue = JSON.parse(data);
            if (messageQueue.length > 0) {
                console.log(`📦 Loaded ${messageQueue.length} pending messages from queue`);
            }
        }
    }
    catch (error) {
        console.error('❌ Failed to load message queue:', error);
        messageQueue = [];
    }
}
/**
 * Save queue to file
 */
function saveQueue() {
    try {
        ensureDataDir();
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(messageQueue, null, 2));
        if (messageQueue.length > 0) {
            console.log(`💾 Saved ${messageQueue.length} pending messages to queue`);
        }
    }
    catch (error) {
        console.error('❌ Failed to save message queue:', error);
    }
}
/**
 * Add message to queue
 */
function queueMessage(chatId, text, parseMode) {
    const message = {
        id: generateId(),
        chatId,
        text,
        parseMode,
        createdAt: new Date().toISOString(),
        attempts: 0,
    };
    messageQueue.push(message);
    saveQueue();
    console.log(`📥 Message queued for chat ${chatId} (queue size: ${messageQueue.length})`);
}
/**
 * Get queue size
 */
function getQueueSize() {
    return messageQueue.length;
}
/**
 * Process all pending messages in queue
 */
async function processQueue(bot) {
    if (messageQueue.length === 0) {
        return;
    }
    console.log(`📤 Processing ${messageQueue.length} pending messages...`);
    const processedIds = [];
    const failedMessages = [];
    for (const message of messageQueue) {
        try {
            await (0, retry_1.retryWithBackoff)(() => bot.api.sendMessage(message.chatId, message.text, {
                parse_mode: message.parseMode,
            }), { maxRetries: 2, baseDelay: 1000 });
            processedIds.push(message.id);
            console.log(`✅ Sent queued message to chat ${message.chatId}`);
        }
        catch (error) {
            message.attempts++;
            // Keep message if under max attempts (5)
            if (message.attempts < 5) {
                failedMessages.push(message);
                console.log(`⚠️ Failed to send message to ${message.chatId}, will retry later (attempt ${message.attempts}/5)`);
            }
            else {
                console.error(`❌ Message to ${message.chatId} failed after ${message.attempts} attempts, removing from queue`);
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
function clearQueue() {
    messageQueue = [];
    saveQueue();
    console.log('🗑️ Message queue cleared');
}
//# sourceMappingURL=messageQueue.js.map