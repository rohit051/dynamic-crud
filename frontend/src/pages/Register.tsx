import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { isValidEmail, validatePassword, isValidPhone } from "../utils/validators";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // client-side validation
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (phone && !isValidPhone(phone)) return setError("Please enter phone in E.164 format, e.g. +123456789");
    const pw = validatePassword(password);
    if (!pw.valid) return setError(pw.errors.join("; "));

    try {
      const res = await authService.register({ name, email, password, phone, role: "user" });
      // We no longer return a token on registration; just show verification instructions
      setShowVerification(true);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>
      {showVerification ? (
        <div>
          <h2>Check Your Email</h2>
          <p style={{ color: "#555", marginBottom: 12 }}>
            A verification email has been sent to <strong>{email}</strong>. Please click the link in the email to verify your account.
          </p>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => {
                // can call resend endpoint here in future
                setShowVerification(false);
              }}
              style={{ background: "none", border: "none", color: "#0066cc", cursor: "pointer", textDecoration: "underline" }}
            >
              click here
            </button>
            {" "}to resend.
          </p>
          <button onClick={() => navigate("/login")} style={{ padding: "8px 12px" }}>
            Back to Login
          </button>
        </div>
      ) : (
        <>
          <h2>Create account</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 8 }}>
              <input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                required
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <input
                placeholder="Phone (with country code, e.g. +123456789)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                required
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                required
              />
            </div>
            <button type="submit" style={{ padding: "8px 12px" }}>
              Create account
            </button>
          </form>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </div>
  );
}
