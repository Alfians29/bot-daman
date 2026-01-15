import { Bot } from 'grammy';
/**
 * Set bot start time (called when bot starts)
 */
export declare function setBotStartTime(): void;
/**
 * Send daily reminder (exported for testing via command)
 */
export declare function sendDailyReminder(bot: Bot): Promise<void>;
/**
 * Setup scheduled rekap jobs
 */
export declare function setupScheduler(bot: Bot): void;
//# sourceMappingURL=scheduler.d.ts.map