import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";
import { isValidEmail } from "../utils/validators";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isInactive, setIsInactive] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowRegister(false);
    setIsInactive(false);
    setIsUnverified(false);

    // basic client-side email validation
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (!password.trim()) return setError("Please enter your password.");

    setIsSubmitting(true);

    try {
      const res = await authService.login(email, password);
      if (!res || !res.token) return setError("Invalid credentials");
      localStorage.setItem("token", res.token);
      localStorage.setItem("currentUser", JSON.stringify(res.user || {}));
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Login failed";
      setError(msg);
      // If credentials are invalid, offer register/forgot links.
      if (err?.response?.status === 401) {
        setShowRegister(true);
        setIsInactive(false);
        setIsUnverified(false);
      }
      // If email is unverified, show verification message.
      if (err?.response?.status === 403 && msg.includes("verify")) {
        setIsUnverified(true);
        setIsInactive(false);
        setShowRegister(false);
      }
      // If user is inactive, show inactive message.
      if (err?.response?.status === 403 && msg.includes("inactive")) {
        setIsInactive(true);
        setShowRegister(false);
        setIsUnverified(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "linear-gradient(135deg, #f8fbff 0%, #eef5ff 60%, #f7f0ff 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 920,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "#fff",
          border: "1px solid #e7edf7",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 14px 40px rgba(28, 54, 104, 0.12)",
        }}
      >
        <div style={{ padding: 30, background: "linear-gradient(160deg, #2458c6 0%, #4b7be5 100%)", color: "#fff" }}>
          <p style={{ margin: 0, opacity: 0.88, fontSize: 14 }}>Welcome back</p>
          <h2 style={{ marginTop: 8, marginBottom: 12, fontSize: 30 }}>AI Dynamic CRUD</h2>
          <p style={{ marginTop: 0, marginBottom: 18, lineHeight: 1.5, opacity: 0.96 }}>
            Manage domain-based products and news with secure, role-based access.
          </p>
          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            <div>✓ Domain permissions by admin</div>
            <div>✓ Category and subcategory workflows</div>
            <div>✓ Secure account verification and recovery</div>
          </div>
        </div>

        <div style={{ padding: 30 }}>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Sign in</h2>
          <p style={{ marginTop: 0, marginBottom: 18, color: "#556" }}>Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#334" }}>Email</label>
              <input
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: 11, border: "1px solid #d8e0ee", borderRadius: 8, outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#334" }}>Password</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: 11, border: "1px solid #d8e0ee", borderRadius: 8, outline: "none" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{ padding: "0 12px", borderRadius: 8, border: "1px solid #d8e0ee", background: "#fff", cursor: "pointer" }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 14, textAlign: "right" }}>
              <Link to="/forgot-password" style={{ fontSize: 14 }}>Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 8,
                border: "none",
                color: "#fff",
                background: isSubmitting ? "#8ea7d6" : "#2458c6",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {error && <p style={{ color: "#c62828", marginTop: 12, marginBottom: 0 }}>{error}</p>}
          {isUnverified ? (
            <div style={{ marginTop: 12, color: "#e67e22" }}>
              <p style={{ marginBottom: 12 }}>Please verify your email address before logging in.</p>
              <button
                onClick={() => navigate("/verify-email")}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e6c39a", background: "#fff6ea", cursor: "pointer" }}
              >
                Verify Email
              </button>
            </div>
          ) : isInactive ? (
            <div style={{ marginTop: 12, color: "#a33" }}>
              <p>You are an inactive user. Connect with an admin to reactivate your account.</p>
            </div>
          ) : showRegister ? (
            <div style={{ marginTop: 12 }}>
              <p style={{ marginBottom: 8, color: "#555" }}>No account found for that email.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => navigate("/register")} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d8e0ee", background: "#fff" }}>
                  Create an account
                </button>
                <button onClick={() => navigate("/forgot-password")} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d8e0ee", background: "#fff" }}>
                  Forgot password
                </button>
              </div>
            </div>
          ) : (
            <p style={{ marginTop: 12, color: "#555", fontSize: 14 }}>
              Don&apos;t have an account? <Link to="/register">Create one</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
