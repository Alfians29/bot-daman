import { Context } from 'grammy';
/**
 * Handle attendance commands: /pagi, /malam, /piketpagi, /piketmalam, /libur
 */
export declare function handleAbsensi(ctx: Context, command: string): Promise<void>;
/**
 * Get command from message caption
 */
export declare function extractCommand(caption: string | undefined): string | null;
//# sourceMappingURL=absensi.d.ts.map