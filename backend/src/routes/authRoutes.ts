import { Router } from "express";
import { register, login, changePassword, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail } from "../controllers/authController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

export default router;
