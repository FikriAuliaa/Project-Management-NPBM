import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Fail-fast mechanism: Prevent the application from starting if the secret is missing in production.
// Falling back to a hardcoded string is a critical security risk.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error(
    "FATAL ERROR: JWT_SECRET environment variable is not defined.",
  );
}

// Enforce type safety for the decoded JWT payload to prevent runtime property errors
interface UserPayload {
  id: string;
  username: string;
  role: string;
  department?: string | object;
}

// Extend Express Request interface to allow attaching the authenticated user payload downstream
export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // Support both cookie-based (secure browser consumption) and header-based (API/Mobile) token extraction
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ error: "Access denied. No authentication token provided." });
  }

  try {
    // Validate the token signature and expiration to ensure the request is from a legitimate session
    const decoded = jwt.verify(
      token,
      JWT_SECRET || "default_fallback_secret_for_local_dev_only",
    ) as UserPayload;

    // Attach decoded user context to the request object for downstream controllers to utilize
    req.user = decoded;

    next();
  } catch (error) {
    // Catch token modification or expiration gracefully without crashing the server
    return res
      .status(403)
      .json({ error: "Authentication session is invalid or has expired." });
  }
};

export const isManager = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "User identity not found in request context." });
  }

  // Normalize case to prevent bypasses via irregular casing (e.g., "MaNaGeR")
  const role = req.user.role.toLowerCase();

  // Restrict access to endpoints that require elevated operational privileges
  if (role !== "manager" && role !== "admin") {
    return res
      .status(403)
      .json({
        error:
          "Insufficient permissions. Requires Manager or Administrator access.",
      });
  }
  next();
};

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "User identity not found in request context." });
  }

  const role = req.user.role.toLowerCase();

  // Restrict access strictly to System Administrators (e.g., for user management)
  if (role !== "admin") {
    return res
      .status(403)
      .json({
        error: "Insufficient permissions. Requires Administrator access.",
      });
  }
  next();
};
