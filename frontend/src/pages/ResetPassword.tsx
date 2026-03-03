import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import authService from "../services/authService";
import { validatePassword } from "../utils/validators";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") || "";
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const pw = validatePassword(newPassword);
    if (!pw.valid) return setMessage(pw.errors.join("; "));

    try {
      const res = await authService.resetPassword(token, newPassword);
      setMessage(res.message || "Password reset");
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>
      <h2>Reset password</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>
        <button type="submit">Reset password</button>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
