import React, { useEffect, useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import contentService from "../services/contentService";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [domainName, setDomainName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  })();

  const isAdmin = currentUser && currentUser.role === "admin";

  const load = async () => {
    try {
      const [docs, domainDocs] = await Promise.all([
        contentService.getCategories(),
        contentService.getDomains(),
      ]);
      setCategories(docs || []);
      setDomains(domainDocs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createCategory = async () => {
    try {
      if (!name.trim() || !domainName) return alert("Category name and domain are required");
      await contentService.createCategory({ name: name.trim(), domainName, description: description.trim() || undefined });
      setName("");
      setDomainName("");
      setDescription("");
      setEditingId(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create category");
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item._id);
    setName(item.name || "");
    setDomainName(item.domainName || "");
    setDescription(item.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setDomainName("");
    setDescription("");
  };

  const saveEdit = async () => {
    try {
      if (!editingId) return;
      if (!name.trim() || !domainName) return alert("Category name and domain are required");
      await contentService.updateCategory(editingId, {
        name: name.trim(),
        domainName,
        description: description.trim() || undefined,
      });
      cancelEdit();
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update category");
    }
  };

  const removeCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await contentService.deleteCategory(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
      <DashboardSidebar />
      <main className="admin-content" style={{ flex: 1 }}>
        <h2>Categories</h2>
        {isAdmin ? (
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr auto", marginBottom: 16 }}>
            <select value={domainName} onChange={(e) => setDomainName(e.target.value)}>
              <option value="">Select domain</option>
              {domains.map((domain: any) => (
                <option key={domain._id} value={domain.name}>{domain.displayName || domain.name}</option>
              ))}
            </select>
            <input
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!domainName}
            />
            <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            {editingId ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveEdit}>💾 Update</button>
                <button onClick={cancelEdit}>✖ Cancel</button>
              </div>
            ) : (
              <button onClick={createCategory}>Create</button>
            )}
          </div>
        ) : (
          <p style={{ color: "#666" }}>Only admin can create categories.</p>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8 }}>Name</th>
              <th style={{ textAlign: "left", padding: 8 }}>Domain</th>
              <th style={{ textAlign: "left", padding: 8 }}>Description</th>
              {isAdmin && <th style={{ textAlign: "left", padding: 8 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} style={{ padding: 8 }}>No categories found.</td>
              </tr>
            )}
            {categories.map((item: any) => (
              <tr key={item._id}>
                <td style={{ padding: 8 }}>{item.name}</td>
                <td style={{ padding: 8 }}>{item.domainName || "-"}</td>
                <td style={{ padding: 8 }}>{item.description || "-"}</td>
                {isAdmin && (
                  <td style={{ padding: 8 }}>
                    <button onClick={() => startEdit(item)} style={{ marginRight: 8 }}>✏️</button>
                    <button onClick={() => removeCategory(item._id)} style={{ color: "#c00" }}>🗑️</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
