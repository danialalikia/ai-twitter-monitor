/**
 * Atomic lock implementation using dedicated execution_locks table
 * Uses UNIQUE constraint + INSERT to ensure only one process can acquire lock
 */

import { getDb } from "./db";
import { executionLocks } from "../drizzle/schema";
import { and, eq, lt } from "drizzle-orm";

/**
 * Try to acquire lock for a schedule at a specific time
 * Returns true if lock was acquired, false if already locked
 * 
 * This is ATOMIC because of UNIQUE constraint on (scheduleId, executionMinute)
 * Only ONE process can successfully INSERT - others will get duplicate key error
 */
export async function tryAcquireScheduleLock(
  scheduleId: number,
  currentMinute: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Lock] Cannot acquire lock: database not available");
    return false;
  }

  try {
    // Try to INSERT lock
    // If UNIQUE constraint is violated, this will throw an error
    await db.insert(executionLocks).values({
      scheduleId,
      executionMinute: currentMinute,
    });
    
    console.log(`[Lock] ✓ Acquired lock for schedule ${scheduleId} at ${currentMinute}`);
    return true;
  } catch (error: any) {
    // Check if error is duplicate key (lock already exists)
    if (error?.code === 'ER_DUP_ENTRY' || error?.message?.includes('duplicate') || error?.message?.includes('UNIQUE')) {
      console.log(`[Lock] ✗ Failed to acquire lock for schedule ${scheduleId} at ${currentMinute} - already locked`);
      return false;
    }
    
    // Other errors
    console.error(`[Lock] Error acquiring lock for schedule ${scheduleId}:`, error);
    return false;
  }
}

/**
 * Release lock for a schedule at specific minute
 */
export async function releaseScheduleLock(scheduleId: number, executionMinute: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Lock] Cannot release lock: database not available");
    return;
  }

  try {
    await db
      .delete(executionLocks)
      .where(
        and(
          eq(executionLocks.scheduleId, scheduleId),
          eq(executionLocks.executionMinute, executionMinute)
        )
      );
    
    console.log(`[Lock] Released lock for schedule ${scheduleId} at ${executionMinute}`);
  } catch (error) {
    console.error(`[Lock] Error releasing lock for schedule ${scheduleId}:`, error);
  }
}

/**
 * Clean up old locks (older than 5 minutes)
 * This is a safety mechanism in case locks are not properly released
 */
export async function cleanupOldLocks(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    await db
      .delete(executionLocks)
      .where(lt(executionLocks.acquiredAt, fiveMinutesAgo));
    
    console.log(`[Lock] Cleaned up old locks`);
  } catch (error) {
    console.error(`[Lock] Error cleaning up old locks:`, error);
  }
}
