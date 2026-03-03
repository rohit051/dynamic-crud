import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getCategories = async () => {
  const res = await axios.get(`${API_BASE}/Category`, { headers: authHeader() });
  return res.data?.docs || [];
};

const createCategory = async (payload: { name: string; domainName: string; description?: string }) => {
  const res = await axios.post(`${API_BASE}/Category`, payload, { headers: authHeader() });
  return res.data;
};

const updateCategory = async (id: string, payload: { name?: string; domainName?: string; description?: string }) => {
  const res = await axios.put(`${API_BASE}/Category/${id}`, payload, { headers: authHeader() });
  return res.data;
};

const deleteCategory = async (id: string) => {
  const res = await axios.delete(`${API_BASE}/Category/${id}`, { headers: authHeader() });
  return res.data;
};

const getSubcategories = async () => {
  const res = await axios.get(`${API_BASE}/Subcategory`, { headers: authHeader() });
  return res.data?.docs || [];
};

const createSubcategory = async (payload: { name: string; description?: string; category: string }) => {
  const res = await axios.post(`${API_BASE}/Subcategory`, payload, { headers: authHeader() });
  return res.data;
};

const updateSubcategory = async (id: string, payload: { name?: string; description?: string; category?: string }) => {
  const res = await axios.put(`${API_BASE}/Subcategory/${id}`, payload, { headers: authHeader() });
  return res.data;
};

const deleteSubcategory = async (id: string) => {
  const res = await axios.delete(`${API_BASE}/Subcategory/${id}`, { headers: authHeader() });
  return res.data;
};

const getDomains = async () => {
  const res = await axios.get(`${API_BASE}/Domain`, { headers: authHeader() });
  return res.data?.docs || [];
};

const createDomain = async (payload: { name: string; displayName?: string }) => {
  const normalized = {
    name: String(payload.name || "").trim().toLowerCase(),
    displayName: payload.displayName,
  };
  const res = await axios.post(`${API_BASE}/Domain`, normalized, { headers: authHeader() });
  return res.data;
};

const createProduct = async (payload: any) => {
  const res = await axios.post(`${API_BASE}/Product`, payload, { headers: authHeader() });
  return res.data;
};

const getProducts = async () => {
  const res = await axios.get(`${API_BASE}/Product`, { headers: authHeader() });
  return res.data?.docs || [];
};

const updateProduct = async (id: string, payload: any) => {
  const res = await axios.put(`${API_BASE}/Product/${id}`, payload, { headers: authHeader() });
  return res.data;
};

const deleteProduct = async (id: string) => {
  const res = await axios.delete(`${API_BASE}/Product/${id}`, { headers: authHeader() });
  return res.data;
};

const createNews = async (payload: any) => {
  const res = await axios.post(`${API_BASE}/News`, payload, { headers: authHeader() });
  return res.data;
};

const getNews = async () => {
  const res = await axios.get(`${API_BASE}/News`, { headers: authHeader() });
  return res.data?.docs || [];
};

const updateNews = async (id: string, payload: any) => {
  const res = await axios.put(`${API_BASE}/News/${id}`, payload, { headers: authHeader() });
  return res.data;
};

const deleteNews = async (id: string) => {
  const res = await axios.delete(`${API_BASE}/News/${id}`, { headers: authHeader() });
  return res.data;
};

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getDomains,
  createDomain,
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  createNews,
  getNews,
  updateNews,
  deleteNews,
};
