/**
 * Atomic lock implementation for scheduler using raw SQL
 * Uses UPDATE with WHERE condition to ensure only one process can acquire the lock
 */

import { getDb } from "./db";

/**
 * Try to acquire lock for a schedule at a specific time
 * Returns true if lock was acquired, false if already locked
 * 
 * This is an ATOMIC operation - only one process will succeed
 */
export async function tryAcquireScheduleLock(
  scheduleId: number,
  currentMinute: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot acquire lock: database not available");
    return false;
  }

  try {
    // ATOMIC UPDATE using raw SQL
    // Only update if lastExecutionMinute is NULL or different from currentMinute
    // This ensures only ONE process can set the lock for this minute
    const sql = `
      UPDATE scheduledPosts 
      SET lastExecutionMinute = ?, lastRunAt = NOW()
      WHERE id = ? 
        AND (lastExecutionMinute IS NULL OR lastExecutionMinute != ?)
    `;
    
    // @ts-ignore - execute raw SQL
    const result = await db.execute(sql, [currentMinute, scheduleId, currentMinute]);
    
    // Check affected rows
    // @ts-ignore - result array format from mysql2
    const affectedRows = result?.[0]?.affectedRows ?? 0;
    
    if (affectedRows > 0) {
      console.log(`[Lock] ✓ Acquired lock for schedule ${scheduleId} at ${currentMinute}`);
      return true;
    } else {
      console.log(`[Lock] ✗ Failed to acquire lock for schedule ${scheduleId} at ${currentMinute} - already locked`);
      return false;
    }
  } catch (error) {
    console.error(`[Lock] Error acquiring lock for schedule ${scheduleId}:`, error);
    return false;
  }
}

/**
 * Release lock for a schedule (set to null)
 * Called when minute changes to allow execution in new minute
 */
export async function releaseScheduleLock(scheduleId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot release lock: database not available");
    return;
  }

  try {
    const sql = `UPDATE scheduledPosts SET lastExecutionMinute = NULL WHERE id = ?`;
    
    // @ts-ignore - execute raw SQL
    await db.execute(sql, [scheduleId]);
    
    console.log(`[Lock] Released lock for schedule ${scheduleId}`);
  } catch (error) {
    console.error(`[Lock] Error releasing lock for schedule ${scheduleId}:`, error);
  }
}
