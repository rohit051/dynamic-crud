import React, { useEffect, useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import contentService from "../services/contentService";

export default function SubcategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
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
      const [cats, subs] = await Promise.all([contentService.getCategories(), contentService.getSubcategories()]);
      setCategories(cats || []);
      setSubcategories(subs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createSubcategory = async () => {
    try {
      if (!name.trim() || !category) return alert("Name and category are required");
      await contentService.createSubcategory({ name: name.trim(), description: description.trim() || undefined, category });
      setName("");
      setDescription("");
      setCategory("");
      setEditingId(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create subcategory");
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item._id);
    setName(item.name || "");
    setDescription(item.description || "");
    setCategory(String(item.category || ""));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setCategory("");
  };

  const saveEdit = async () => {
    try {
      if (!editingId) return;
      if (!name.trim() || !category) return alert("Name and category are required");
      await contentService.updateSubcategory(editingId, {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
      });
      cancelEdit();
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update subcategory");
    }
  };

  const removeSubcategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;
    try {
      await contentService.deleteSubcategory(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete subcategory");
    }
  };

  const categoryName = (id: string) => categories.find((c: any) => c._id === id)?.name || "-";

  return (
    <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
      <DashboardSidebar />
      <main className="admin-content" style={{ flex: 1 }}>
        <h2>Subcategories</h2>
        {isAdmin ? (
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr auto", marginBottom: 16 }}>
            <input placeholder="Subcategory name" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {categories.map((item: any) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
            {editingId ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveEdit}>💾 Update</button>
                <button onClick={cancelEdit}>✖ Cancel</button>
              </div>
            ) : (
              <button onClick={createSubcategory}>Create</button>
            )}
          </div>
        ) : (
          <p style={{ color: "#666" }}>Only admin can create subcategories.</p>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8 }}>Name</th>
              <th style={{ textAlign: "left", padding: 8 }}>Category</th>
              <th style={{ textAlign: "left", padding: 8 }}>Description</th>
              {isAdmin && <th style={{ textAlign: "left", padding: 8 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {subcategories.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} style={{ padding: 8 }}>No subcategories found.</td>
              </tr>
            )}
            {subcategories.map((item: any) => (
              <tr key={item._id}>
                <td style={{ padding: 8 }}>{item.name}</td>
                <td style={{ padding: 8 }}>{categoryName(String(item.category))}</td>
                <td style={{ padding: 8 }}>{item.description || "-"}</td>
                {isAdmin && (
                  <td style={{ padding: 8 }}>
                    <button onClick={() => startEdit(item)} style={{ marginRight: 8 }}>✏️</button>
                    <button onClick={() => removeSubcategory(item._id)} style={{ color: "#c00" }}>🗑️</button>
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
