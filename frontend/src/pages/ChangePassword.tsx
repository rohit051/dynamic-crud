import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { validatePassword } from "../utils/validators";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const pw = validatePassword(newPassword);
    if (!pw.valid) return setError(pw.errors.join("; "));

    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess("Password changed successfully. Please login again.");
      // clear token and redirect to login after short delay
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        navigate("/login");
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>
      <h2>Change password</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
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
        <button type="submit">Change password</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
}
