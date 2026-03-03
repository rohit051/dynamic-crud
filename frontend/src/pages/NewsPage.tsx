import React, { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import contentService from "../services/contentService";

export default function NewsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", categoryId: "", subcategoryId: "" });

  const load = async () => {
    try {
      const [cats, subs, docs] = await Promise.all([
        contentService.getCategories(),
        contentService.getSubcategories(),
        contentService.getNews(),
      ]);
      setCategories(cats || []);
      setSubcategories(subs || []);
      setNewsItems(docs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredSubcategories = useMemo(
    () => subcategories.filter((item: any) => (form.categoryId ? String(item.category) === form.categoryId : true)),
    [subcategories, form.categoryId]
  );
  const newsCategories = useMemo(
    () => categories.filter((item: any) => String(item.domainName || "").toLowerCase() === "news"),
    [categories]
  );

  const createNews = async () => {
    try {
      if (!form.title.trim() || !form.content.trim() || !form.categoryId) {
        return alert("Title, content and category are required");
      }

      await contentService.createNews({
        title: form.title.trim(),
        content: form.content.trim(),
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || undefined,
      });

      setForm({ title: "", content: "", categoryId: "", subcategoryId: "" });
      setEditingId(null);
      await load();
      alert("News saved");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create news");
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      content: item.content || "",
      categoryId: String(item.categoryId || ""),
      subcategoryId: String(item.subcategoryId || ""),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", content: "", categoryId: "", subcategoryId: "" });
  };

  const saveOrCreate = async () => {
    if (!editingId) return createNews();
    try {
      await contentService.updateNews(editingId, {
        title: form.title.trim(),
        content: form.content.trim(),
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || null,
      });
      await load();
      cancelEdit();
      alert("News updated");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update news");
    }
  };

  const removeNews = async (id: string) => {
    if (!confirm("Delete this news item?")) return;
    try {
      await contentService.deleteNews(id);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete news");
    }
  };

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  })();
  const isAdmin = currentUser && currentUser.role === "admin";
  const domainPermissions: string[] = Array.isArray(currentUser?.domainPermissions)
    ? currentUser.domainPermissions.map((item: string) => String(item).toLowerCase())
    : [];
  const canAccessNews = isAdmin || domainPermissions.includes("news");

  if (!canAccessNews) {
    return (
      <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
        <DashboardSidebar />
        <main className="admin-content" style={{ flex: 1 }}>
          <h2>News</h2>
          <p style={{ color: "#666" }}>You do not have permission to access this domain.</p>
        </main>
      </div>
    );
  }

  const ownNews = newsItems.filter((item: any) => String(item.createdBy) === String(currentUser?._id || ""));
  const categoryName = (id: string) => categories.find((c: any) => c._id === id)?.name || "-";
  const subcategoryName = (id: string) => subcategories.find((s: any) => s._id === id)?.name || "-";

  return (
    <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
      <DashboardSidebar />
      <main className="admin-content" style={{ flex: 1 }}>
        <h2>News</h2>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
          <select value={form.categoryId} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value, subcategoryId: "" }))}>
            <option value="">Select category</option>
            {newsCategories.map((item: any) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
          <select value={form.subcategoryId} onChange={(e) => setForm((s) => ({ ...s, subcategoryId: e.target.value }))}>
            <option value="">Select subcategory</option>
            {filteredSubcategories.map((item: any) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Content"
          rows={6}
          value={form.content}
          onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
          style={{ width: "100%", marginTop: 8 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={saveOrCreate}>{editingId ? "💾 Update News" : "💾 Save News"}</button>
          {editingId && <button onClick={cancelEdit}>✖ Cancel</button>}
        </div>

        <h3 style={{ marginTop: 20 }}>My News</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8 }}>Title</th>
              <th style={{ textAlign: "left", padding: 8 }}>Category</th>
              <th style={{ textAlign: "left", padding: 8 }}>Subcategory</th>
              <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ownNews.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 8 }}>No news created by you yet.</td>
              </tr>
            )}
            {ownNews.map((item: any) => (
              <tr key={item._id}>
                <td style={{ padding: 8 }}>{item.title}</td>
                <td style={{ padding: 8 }}>{categoryName(String(item.categoryId))}</td>
                <td style={{ padding: 8 }}>{subcategoryName(String(item.subcategoryId))}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => startEdit(item)} style={{ marginRight: 8 }}>✏️</button>
                  <button onClick={() => removeNews(item._id)} style={{ color: "#c00" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
