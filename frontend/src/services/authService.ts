import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const login = async (email: string, password: string) => {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return res.data; // expected { token, user }
};

const register = async (payload: any) => {
  const res = await axios.post(`${API_BASE}/auth/register`, payload);
  return res.data;
};

const changePassword = async (currentPassword: string, newPassword: string) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post(`${API_BASE}/auth/change-password`, { currentPassword, newPassword }, { headers });
  return res.data;
};

const forgotPassword = async (email: string) => {
  const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
  return res.data;
};

const resetPassword = async (token: string, newPassword: string) => {
  const res = await axios.post(`${API_BASE}/auth/reset-password`, { token, newPassword });
  return res.data;
};

const verifyEmail = async (token: string) => {
  const res = await axios.post(`${API_BASE}/auth/verify-email`, { token });
  return res.data;
};

const resendVerificationEmail = async (email: string) => {
  const res = await axios.post(`${API_BASE}/auth/resend-verification`, { email });
  return res.data;
};

export default { login, register, changePassword, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail };
