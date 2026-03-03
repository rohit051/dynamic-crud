import React, { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import contentService from "../services/contentService";

export default function ProductsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: "0",
    currency: "USD",
    categoryId: "",
    subcategoryId: "",
  });

  const load = async () => {
    try {
      const [cats, subs, docs] = await Promise.all([
        contentService.getCategories(),
        contentService.getSubcategories(),
        contentService.getProducts(),
      ]);
      setCategories(cats || []);
      setSubcategories(subs || []);
      setProducts(docs || []);
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
  const productCategories = useMemo(
    () => categories.filter((item: any) => String(item.domainName || "").toLowerCase() === "product"),
    [categories]
  );

  const createProduct = async () => {
    try {
      if (!form.title.trim() || !form.price || !form.categoryId) {
        return alert("Title, price and category are required");
      }

      await contentService.createProduct({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        stock: Number(form.stock || 0),
        currency: form.currency || "USD",
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || undefined,
      });

      setForm({
        title: "",
        description: "",
        price: "",
        stock: "0",
        currency: "USD",
        categoryId: "",
        subcategoryId: "",
      });
      setEditingId(null);
      await load();
      alert("Product saved");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create product");
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      description: item.description || "",
      price: String(item.price ?? ""),
      stock: String(item.stock ?? 0),
      currency: item.currency || "USD",
      categoryId: String(item.categoryId || ""),
      subcategoryId: String(item.subcategoryId || ""),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      price: "",
      stock: "0",
      currency: "USD",
      categoryId: "",
      subcategoryId: "",
    });
  };

  const saveOrCreate = async () => {
    if (!editingId) return createProduct();
    try {
      await contentService.updateProduct(editingId, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        stock: Number(form.stock || 0),
        currency: form.currency || "USD",
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || null,
      });
      await load();
      cancelEdit();
      alert("Product updated");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update product");
    }
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await contentService.deleteProduct(id);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete product");
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
  const canAccessProduct = isAdmin || domainPermissions.includes("product");

  if (!canAccessProduct) {
    return (
      <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
        <DashboardSidebar />
        <main className="admin-content" style={{ flex: 1 }}>
          <h2>Products</h2>
          <p style={{ color: "#666" }}>You do not have permission to access this domain.</p>
        </main>
      </div>
    );
  }

  const ownProducts = products.filter((item: any) => String(item.createdBy) === String(currentUser?._id || ""));
  const categoryName = (id: string) => categories.find((c: any) => c._id === id)?.name || "-";
  const subcategoryName = (id: string) => subcategories.find((s: any) => s._id === id)?.name || "-";

  return (
    <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
      <DashboardSidebar />
      <main className="admin-content" style={{ flex: 1 }}>
        <h2>Products</h2>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
          <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} />
          <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))} />
          <input placeholder="Currency" value={form.currency} onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))} />
          <select value={form.categoryId} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value, subcategoryId: "" }))}>
            <option value="">Select category</option>
            {productCategories.map((item: any) => (
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
          placeholder="Description"
          rows={4}
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          style={{ width: "100%", marginTop: 8 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={saveOrCreate}>{editingId ? "💾 Update Product" : "💾 Save Product"}</button>
          {editingId && <button onClick={cancelEdit}>✖ Cancel</button>}
        </div>

        <h3 style={{ marginTop: 20 }}>My Products</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8 }}>Title</th>
              <th style={{ textAlign: "left", padding: 8 }}>Price</th>
              <th style={{ textAlign: "left", padding: 8 }}>Category</th>
              <th style={{ textAlign: "left", padding: 8 }}>Subcategory</th>
              <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ownProducts.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 8 }}>No products created by you yet.</td>
              </tr>
            )}
            {ownProducts.map((item: any) => (
              <tr key={item._id}>
                <td style={{ padding: 8 }}>{item.title}</td>
                <td style={{ padding: 8 }}>{item.price}</td>
                <td style={{ padding: 8 }}>{categoryName(String(item.categoryId))}</td>
                <td style={{ padding: 8 }}>{subcategoryName(String(item.subcategoryId))}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => startEdit(item)} style={{ marginRight: 8 }}>✏️</button>
                  <button onClick={() => removeProduct(item._id)} style={{ color: "#c00" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
