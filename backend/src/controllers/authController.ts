import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailService";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Helper function to sanitize user object for responses
const sanitizeUser = (user: any) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  // Remove sensitive fields
  delete userObj.password;
  delete userObj.isVerified;
  delete userObj.isActive;
  delete userObj.resetToken;
  delete userObj.resetTokenExpiry;
  delete userObj.verificationToken;
  return userObj;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    // basic phone validation (expect E.164 like +123456789)
    if (phone) {
      const phoneClean = String(phone).trim();
      if (!/^\+\d{7,15}$/.test(phoneClean)) return res.status(400).json({ message: "Phone must be in E.164 format (e.g. +123456789)" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "User already exists" });

    if (phone) {
      const existingPhone = await User.findOne({ phone: String(phone).trim() });
      if (existingPhone) return res.status(409).json({ message: "Phone already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    // enforce role: only specific admin email gets admin role, otherwise default to 'user'
    const adminEmail = process.env.ADMIN_EMAIL;
    const assignedRole = email === adminEmail ? "admin" : "user";
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const createData: any = { name, email, password: hashed, role: assignedRole, verificationToken, isVerified: false };
    if (phone) createData.phone = String(phone).trim();
    const user = await User.create(createData);

    const userObj = sanitizeUser(user);

    // Send verification email (non-blocking)
    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
    sendVerificationEmail(email, verificationToken, verificationLink).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    // Do not return JWT token on registration – only the user and a message
    res.json({ user: userObj, message: "Registration successful. Please check your email to verify your account." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration failed", error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user: any = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // prevent unverified users from logging in
    if (user.isVerified === false) {
      return res.status(403).json({ message: "Please verify your email address before logging in." });
    }

    // prevent inactive users from logging in
    if (user.isActive === false) {
      return res.status(403).json({ message: "You are an inactive user. Connect with admin." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    const userObj: any = user.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userFromReq: any = (req as any).user;
    if (!userFromReq) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "currentPassword and newPassword required" });

    const user = await User.findById(userFromReq._id || userFromReq.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Change password failed", error: err });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email required" });

    const user: any = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: "If an account exists, a reset email has been sent" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send password reset email (non-blocking)
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    sendPasswordResetEmail(email, resetLink).catch((err) => {
      console.error("Failed to send password reset email:", err);
    });

    return res.json({ message: "If an account exists, a reset email has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Forgot password failed", error: err });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "token and newPassword required" });

    const user: any = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.json({ message: "Password has been reset" });
  } catch (err) {
    return res.status(500).json({ message: "Reset password failed", error: err });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Verification token required" });

    const user: any = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: "Invalid verification token" });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Email verification failed", error: err });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user: any = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email (non-blocking)
    const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
    sendVerificationEmail(email, verificationToken, verificationLink).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    return res.json({ message: "Verification email has been sent to your email address" });
  } catch (err) {
    console.error("Resend verification error:", err);
    return res.status(500).json({ message: "Resend verification failed", error: err });
  }
};
