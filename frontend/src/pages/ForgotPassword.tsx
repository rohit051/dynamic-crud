import React, { useState } from "react";
import authService from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message || "If an account exists, a reset token has been generated");
      if (res.resetToken) setToken(res.resetToken);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Failed to request reset");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>
      <h2>Forgot password</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>
        <button type="submit">Request reset</button>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
      {token && (
        <div style={{ marginTop: 12 }}>
          <p>Reset token (demo):</p>
          <pre style={{ whiteSpace: "break-spaces", background: "#f7f7f7", padding: 8 }}>{token}</pre>
        </div>
      )}
    </div>
  );
}
