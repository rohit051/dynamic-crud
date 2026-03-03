import nodemailer from "nodemailer";

let transporter: any = null;

const initializeTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASSWORD || "",
      },
    });
  }
  return transporter;
};

export const sendVerificationEmail = async (email: string, verificationToken: string, verificationLink: string) => {
  try {
    const mailer = initializeTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@example.com",
      to: email,
      subject: "Email Verification",
      html: `
        <h2>Welcome!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
        <p>Or copy and paste this token: <code>${verificationToken}</code></p>
        <p>This link expires in 24 hours.</p>
      `,
    };

    await mailer.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (err: any) {
    console.error("Email send failed:", err.message);
    // Don't throw - allow registration to proceed even if email fails
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  try {
    const mailer = initializeTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@example.com",
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
    };

    await mailer.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (err: any) {
    console.error("Email send failed:", err.message);
    // Don't throw - allow password reset to proceed even if email fails
    return false;
  }
};
