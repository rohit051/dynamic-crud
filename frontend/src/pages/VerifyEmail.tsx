import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "../services/authService";

export default function VerifyEmail() {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Auto-read token from query param if present
    const token = searchParams.get("token");
    if (token) {
      setVerificationCode(token);
      handleVerify(token);
    }
  }, [searchParams]);

  const handleVerify = async (token?: string) => {
    const codeToVerify = token || verificationCode;
    if (!codeToVerify) {
      setError("Verification code is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authService.verifyEmail(codeToVerify);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 20, maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ color: "#2ecc71" }}>Email Verified!</h2>
        <p style={{ color: "#555" }}>Your email has been verified successfully. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 420, margin: "0 auto" }}>
      <h2>Verify Email</h2>
      <p style={{ color: "#555" }}>Enter your verification code to confirm your email address.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify();
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
          {loading ? "Verifying..." : "Verify Email"}
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </div>
  );
}
