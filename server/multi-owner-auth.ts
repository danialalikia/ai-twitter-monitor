import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { ENV } from "./_core/env";

/**
 * Multi-owner authentication helper
 * 
 * All owners share the same data by mapping their userId to the primary owner's userId.
 * The primary owner is determined by OWNER_OPEN_ID environment variable.
 */

/**
 * Get the primary owner's user ID (the one who owns all shared data)
 */
export async function getPrimaryOwnerId(): Promise<number> {
  const primaryOwner = await db.getUserByOpenId(ENV.ownerOpenId);
  
  if (!primaryOwner) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Primary owner not found in database",
    });
  }
  
  return primaryOwner.id;
}

/**
 * Check if a user's email is in the owner emails list
 */
export async function isOwnerEmail(userEmail: string | null): Promise<boolean> {
  if (!userEmail) return false;
  
  // Get settings from primary owner
  const primaryOwnerId = await getPrimaryOwnerId();
  const settings = await db.getSettings(primaryOwnerId);
  
  if (!settings || !settings.ownerEmails) return false;
  
  try {
    // ownerEmails is stored as JSON array string
    const ownerEmailsList = JSON.parse(settings.ownerEmails);
    
    if (!Array.isArray(ownerEmailsList)) return false;
    
    // Normalize emails for comparison (lowercase, trim)
    const normalizedUserEmail = userEmail.toLowerCase().trim();
    const normalizedOwnerEmails = ownerEmailsList.map((email: string) => 
      email.toLowerCase().trim()
    );
    
    return normalizedOwnerEmails.includes(normalizedUserEmail);
  } catch (error) {
    console.error("[MultiOwner] Failed to parse ownerEmails:", error);
    return false;
  }
}

/**
 * Get the effective user ID for data access
 * 
 * If the user is an owner (email in ownerEmails list), return primary owner's ID.
 * Otherwise, return the user's own ID.
 * 
 * This ensures all owners see the same shared data.
 */
export async function getEffectiveUserId(userId: number, userEmail: string | null): Promise<number> {
  const isOwner = await isOwnerEmail(userEmail);
  
  if (isOwner) {
    // Owner: use primary owner's ID for shared data access
    return await getPrimaryOwnerId();
  } else {
    // Non-owner: use their own ID
    return userId;
  }
}
