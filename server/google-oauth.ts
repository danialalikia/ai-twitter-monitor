import type { Request, Response } from "express";
import { upsertUser, getUserByOpenId } from "./db";
import { isOwnerEmail, getPrimaryOwnerId } from "./multi-owner-auth";
import { sdk } from "./_core/sdk";

/**
 * Google OAuth for Telegram Mini App
 * 
 * This endpoint handles Google OAuth login for Telegram Mini App users.
 * Only users with emails in the ownerEmails list can access the app.
 */

interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

/**
 * Exchange Google OAuth code for user info
 */
async function getGoogleUserInfo(code: string, redirectUri: string): Promise<GoogleUserInfo> {
  // Exchange code for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get user info
  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userInfoResponse.ok) {
    const error = await userInfoResponse.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  return await userInfoResponse.json();
}

/**
 * Handle Google OAuth callback
 */
export async function handleGoogleOAuthCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // Get redirect URI from environment or construct from request
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const host = req.get("host");
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    // Exchange code for user info
    const userInfo = await getGoogleUserInfo(code, redirectUri);

    console.log("[GoogleOAuth] User info:", { email: userInfo.email, name: userInfo.name });

    // Check if email is in owner emails list
    const isOwner = await isOwnerEmail(userInfo.email);

    if (!isOwner) {
      console.log("[GoogleOAuth] Access denied for email:", userInfo.email);
      return res.status(403).json({ 
        error: "Access Denied", 
        message: "Your email is not in the owner emails list. Please contact the administrator." 
      });
    }

    // Create or update user in database
    const openId = `google:${userInfo.sub}`;
    
    await upsertUser({
      openId,
      email: userInfo.email,
      name: userInfo.name,
      loginMethod: "google",
      lastSignedIn: new Date(),
    });

    // Get user from database
    const user = await getUserByOpenId(openId);

    if (!user) {
      throw new Error("Failed to create user");
    }

    // Create session using SDK
    const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "" });

    // Set session cookie
    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Redirect to app (or close window for Mini App)
    const returnUrl = (state as string) || "/";
    res.redirect(returnUrl);

  } catch (error) {
    console.error("[GoogleOAuth] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Initiate Google OAuth flow
 */
export function initiateGoogleOAuth(req: Request, res: Response) {
  const protocol = req.get("x-forwarded-proto") || req.protocol;
  const host = req.get("host");
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  
  const returnUrl = (req.query.returnUrl as string) || "/";

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", returnUrl);

  res.redirect(authUrl.toString());
}
