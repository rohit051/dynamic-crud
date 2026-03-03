import { Request, Response, NextFunction } from "express";

export default function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const userRole = user.role || (user as any).role;
    if (userRole !== role) return res.status(403).json({ message: "Forbidden: insufficient role" });
    next();
  };
}
