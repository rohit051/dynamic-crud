import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Authorization header missing" });

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ message: "Invalid Authorization format" });

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // attach full user object if possible
    try {
      const user = await User.findById(decoded.id).select("-password");
        if (user) {
          // block inactive users from accessing protected routes
          if (user.isActive === false) {
            return res.status(403).json({ message: "You are an inactive user. Connect with admin." });
          }
          (req as any).user = user;
          return next();
        }
    } catch (e) {
      // ignore and fall back to token payload
    }
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
