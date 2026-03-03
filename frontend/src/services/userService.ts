import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getAll = async (page: number = 1, limit: number = 10) => {
  const res = await axios.get(`${API_BASE}/User`, {
    headers: authHeader(),
    params: { page, limit },
  });
  return res.data; // expected { docs, total, page, pages }
};

const update = async (id: string, payload: any) => {
  const res = await axios.put(`${API_BASE}/User/${id}`, payload, { headers: authHeader() });
  return res.data;
};

const remove = async (id: string) => {
  const res = await axios.delete(`${API_BASE}/User/${id}`, { headers: authHeader() });
  return res.data;
};

export default { getAll, update, remove };
