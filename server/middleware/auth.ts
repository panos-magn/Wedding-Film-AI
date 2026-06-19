import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getDbAdmin } from "../services/dbAdmin";

// Ensure app is initialized
getDbAdmin();

export interface AuthenticatedRequest extends Request {
  uid?: string;
  userEmail?: string;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    req.userEmail = decodedToken.email;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid or expired authorization token" });
    return;
  }
};
