import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";
import { isValidEmail } from "../utils/validators";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [isInactive, setIsInactive] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // basic client-side email validation
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");

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
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 420, margin: "0 auto" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <button type="submit" style={{ padding: "8px 12px" }}>
          Sign in
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {isUnverified ? (
        <div style={{ marginTop: 12, color: "#e67e22" }}>
          <p style={{ marginBottom: 12 }}>Please verify your email address before logging in.</p>
          <button
            onClick={() => navigate("/verify-email")}
            style={{ padding: "8px 12px" }}
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
            <button onClick={() => navigate("/register")} style={{ padding: "8px 12px" }}>
              Create an account
            </button>
            <button onClick={() => navigate("/forgot-password")} style={{ padding: "8px 12px" }}>
              Forgot password
            </button>
          </div>
        </div>
      ) : (
        <p style={{ marginTop: 12, color: "#555" }}>
          Don't have an account? <Link to="/register">Create one</Link> or register via POST `/api/auth/register`.
        </p>
      )}
    </div>
  );
}
