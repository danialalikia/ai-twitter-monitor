import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getEffectiveUserId } from "../multi-owner-auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Effective user ID for data access (primary owner ID if user is an owner, otherwise user's own ID) */
  effectiveUserId: number | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let effectiveUserId: number | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    
    if (user) {
      // Get effective user ID (primary owner ID if user is an owner)
      effectiveUserId = await getEffectiveUserId(user.id, user.email);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
    effectiveUserId = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    effectiveUserId,
  };
}
