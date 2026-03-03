import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import userService from "../services/userService";
import contentService from "../services/contentService";

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [limit] = useState<number>(10);
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  })();
  const domainPermissions: string[] = Array.isArray(currentUser?.domainPermissions)
    ? currentUser.domainPermissions.map((item: string) => String(item).toLowerCase())
    : [];
  const canAccessProduct = (currentUser && currentUser.role === "admin") || domainPermissions.includes("product");
  const canAccessNews = (currentUser && currentUser.role === "admin") || domainPermissions.includes("news");

  // default view: admin users land on Home, normal users also land on Home
  const initialView: "home" | "users" | "other" = location.pathname === "/dashboard/users"
    ? "users"
    : currentUser && currentUser.role === "admin"
      ? "home"
      : "home";
  const [view, setView] = useState<"home" | "users" | "other">(initialView);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [message, setMessage] = useState<string>("");
  const [categoryForm, setCategoryForm] = useState({ name: "", domainName: "", description: "" });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: "", description: "", category: "" });
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: "0",
    currency: "USD",
    categoryId: "",
    subcategoryId: "",
  });
  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    categoryId: "",
    subcategoryId: "",
  });
  const [myProductCount, setMyProductCount] = useState<number>(0);
  const [myNewsCount, setMyNewsCount] = useState<number>(0);
  const [openSections, setOpenSections] = useState({
    domains: false,
    categories: false,
    subcategories: false,
  });

  useEffect(() => {
    if (currentUser && currentUser.role === "admin") {
      fetchUsers(page);
    }
  }, [page]);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      fetchMyContentSummary();
    }
  }, []);

  const fetchMyContentSummary = async () => {
    try {
      const [productsResult, newsResult] = await Promise.allSettled([
        canAccessProduct ? contentService.getProducts() : Promise.resolve([]),
        canAccessNews ? contentService.getNews() : Promise.resolve([]),
      ]);
      const products = productsResult.status === "fulfilled" ? productsResult.value : [];
      const news = newsResult.status === "fulfilled" ? newsResult.value : [];
      const userId = String(currentUser?._id || "");
      setMyProductCount((products || []).filter((item: any) => String(item.createdBy) === userId).length);
      setMyNewsCount((news || []).filter((item: any) => String(item.createdBy) === userId).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshTaxonomy();
  }, []);

  const refreshTaxonomy = async () => {
    try {
      const [categoryDocs, subcategoryDocs] = await Promise.all([
        contentService.getCategories(),
        contentService.getSubcategories(),
      ]);
      const domainDocs = await contentService.getDomains();
      setCategories(categoryDocs);
      setSubcategories(subcategoryDocs);
      setDomains(domainDocs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async (p: number = 1) => {
    try {
      const data = await userService.getAll(p, limit);
      setUsers(data?.docs || []);
      setPage(data?.page || p);
      setPages(data?.pages || 1);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (u: any) => {
    setEditingId(u._id);
    setEditValues({ name: u.name || "", email: u.email || "", phone: u.phone || "", role: u.role || "user", isVerified: u.isVerified || false });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (id: string) => {
    try {
      const payload: any = { name: editValues.name, email: editValues.email, phone: editValues.phone };
      // allow updating role and isVerified only if current user is admin
      const cur = localStorage.getItem("currentUser");
      const cu = cur ? JSON.parse(cur) : null;
      if (cu && cu.role === "admin") {
        payload.role = editValues.role;
        payload.isVerified = editValues.isVerified;
      }

      const updated = await userService.update(id, payload);
      setUsers((prev) => prev.map((p) => (p._id === id ? updated : p)));
      cancelEdit();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update user");
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await userService.remove(id);
      setUsers((prev) => prev.filter((p) => p._id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const toggleActive = async (u: any) => {
    // only admins should be able to toggle
    const cur = localStorage.getItem("currentUser");
    const cu = cur ? JSON.parse(cur) : null;
    if (!cu || cu.role !== "admin") {
      alert("Only administrators can change active status.");
      return;
    }

    try {
      const updated = await userService.update(u._id, { isActive: !u.isActive });
      setUsers((prev) => prev.map((p) => (p._id === u._id ? updated : p)));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update active status");
    }
  };

  const toggleVerified = async (u: any) => {
    // only admins should be able to toggle
    const cur = localStorage.getItem("currentUser");
    const cu = cur ? JSON.parse(cur) : null;
    if (!cu || cu.role !== "admin") {
      alert("Only administrators can change verification status.");
      return;
    }

    try {
      const updated = await userService.update(u._id, { isVerified: !u.isVerified });
      setUsers((prev) => prev.map((p) => (p._id === u._id ? updated : p)));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update verification status");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const createCategory = async () => {
    try {
      if (!categoryForm.name.trim() || !categoryForm.domainName) return alert("Category name and domain are required");
      await contentService.createCategory({
        name: categoryForm.name.trim(),
        domainName: categoryForm.domainName,
        description: categoryForm.description.trim() || undefined,
      });
      setCategoryForm({ name: "", domainName: "", description: "" });
      setMessage("Category created");
      await refreshTaxonomy();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create category");
    }
  };

  const createSubcategory = async () => {
    try {
      if (!subcategoryForm.name.trim() || !subcategoryForm.category) {
        return alert("Subcategory name and category are required");
      }
      await contentService.createSubcategory({
        name: subcategoryForm.name.trim(),
        description: subcategoryForm.description.trim() || undefined,
        category: subcategoryForm.category,
      });
      setSubcategoryForm({ name: "", description: "", category: "" });
      setMessage("Subcategory created");
      await refreshTaxonomy();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create subcategory");
    }
  };

  const createProduct = async () => {
    try {
      if (!productForm.title.trim() || !productForm.price || !productForm.categoryId) {
        return alert("Title, price and category are required");
      }

      await contentService.createProduct({
        title: productForm.title.trim(),
        description: productForm.description.trim() || undefined,
        price: Number(productForm.price),
        stock: Number(productForm.stock || 0),
        currency: productForm.currency || "USD",
        categoryId: productForm.categoryId,
        subcategoryId: productForm.subcategoryId || undefined,
      });

      setProductForm({
        title: "",
        description: "",
        price: "",
        stock: "0",
        currency: "USD",
        categoryId: "",
        subcategoryId: "",
      });
      setMessage("Product created");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create product");
    }
  };

  const createNews = async () => {
    try {
      if (!newsForm.title.trim() || !newsForm.content.trim() || !newsForm.categoryId) {
        return alert("Title, content and category are required");
      }

      await contentService.createNews({
        title: newsForm.title.trim(),
        content: newsForm.content.trim(),
        categoryId: newsForm.categoryId,
        subcategoryId: newsForm.subcategoryId || undefined,
      });

      setNewsForm({ title: "", content: "", categoryId: "", subcategoryId: "" });
      setMessage("News created");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create news");
    }
  };

  const filteredProductSubcategories = subcategories.filter((item: any) =>
    productForm.categoryId ? String(item.category) === productForm.categoryId : true
  );

  const filteredNewsSubcategories = subcategories.filter((item: any) =>
    newsForm.categoryId ? String(item.category) === newsForm.categoryId : true
  );

  const groupButtonStyle = {
    width: "100%",
    padding: "9px 10px",
    textAlign: "left" as const,
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 8,
    color: "#c4d2ef",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const toggleSection = (key: "domains" | "categories" | "subcategories") => {
    setOpenSections((prev) => ({
      domains: false,
      categories: false,
      subcategories: false,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="admin-page" style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 16 }}>
        <aside style={{ width: 230 }}>
          <div style={{ border: "1px solid #1f2a3f", borderRadius: 12, padding: 12, background: "linear-gradient(180deg, #0f172a 0%, #111c34 100%)", boxShadow: "0 12px 28px rgba(9, 16, 30, 0.35)" }}>
          <div style={{ fontSize: 12, color: "#7f91ba", marginBottom: 8, fontWeight: 700 }}>NAVIGATION</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Link to="/dashboard" onClick={() => setView("home")} style={{ padding: "9px 10px", textAlign: "left", background: view === "home" ? "linear-gradient(90deg, rgba(53,106,221,0.26) 0%, rgba(53,106,221,0.14) 100%)" : "transparent", border: view === "home" ? "1px solid rgba(93,141,238,0.45)" : "1px solid transparent", borderRadius: 8, cursor: "pointer", textDecoration: "none", color: view === "home" ? "#d9e7ff" : "#aebee1", fontWeight: view === "home" ? 600 : 500 }}>Home</Link>
            {currentUser && currentUser.role === "admin" && (
              <Link to="/dashboard/users" onClick={() => setView("users")} style={{ padding: "9px 10px", textAlign: "left", background: view === "users" ? "linear-gradient(90deg, rgba(53,106,221,0.26) 0%, rgba(53,106,221,0.14) 100%)" : "transparent", border: view === "users" ? "1px solid rgba(93,141,238,0.45)" : "1px solid transparent", borderRadius: 8, cursor: "pointer", textDecoration: "none", color: view === "users" ? "#d9e7ff" : "#aebee1", fontWeight: view === "users" ? 600 : 500 }}>Users</Link>
            )}
            {currentUser && currentUser.role === "admin" && (
              <button type="button" style={groupButtonStyle} onClick={() => toggleSection("categories")}>
                <span>Categories</span>
                <span>{openSections.categories ? "▾" : "▸"}</span>
              </button>
            )}
            {currentUser && currentUser.role === "admin" && openSections.categories && (
              <Link to="/dashboard/categories" style={{ padding: "9px 10px", marginLeft: 14, fontSize: 13, textAlign: "left", textDecoration: "none", color: "#8fa4cf" }}>- Manage Categories</Link>
            )}
            {currentUser && currentUser.role === "admin" && (
              <button type="button" style={groupButtonStyle} onClick={() => toggleSection("subcategories")}>
                <span>Subcategories</span>
                <span>{openSections.subcategories ? "▾" : "▸"}</span>
              </button>
            )}
            {currentUser && currentUser.role === "admin" && openSections.subcategories && (
              <Link to="/dashboard/subcategories" style={{ padding: "9px 10px", marginLeft: 14, fontSize: 13, textAlign: "left", textDecoration: "none", color: "#8fa4cf" }}>- Manage Subcategories</Link>
            )}
            {currentUser && currentUser.role === "admin" && (
              <button type="button" style={groupButtonStyle} onClick={() => toggleSection("domains")}>
                <span>Domains</span>
                <span>{openSections.domains ? "▾" : "▸"}</span>
              </button>
            )}
            {currentUser && currentUser.role === "admin" && openSections.domains && (
              <Link to="/dashboard/domains" style={{ padding: "9px 10px", marginLeft: 14, fontSize: 13, textAlign: "left", textDecoration: "none", color: "#8fa4cf" }}>- Manage Domains</Link>
            )}
            {currentUser && currentUser.role === "admin" && domains.map((domain: any) => {
              if (!openSections.domains) return null;
              const normalized = String(domain.name || "").toLowerCase();
              const label = domain.displayName || domain.name;

              if (normalized === "product" && canAccessProduct) {
                return (
                  <Link key={domain._id} to="/dashboard/products" style={{ padding: "9px 10px", marginLeft: 14, fontSize: 13, textAlign: "left", textDecoration: "none", color: "#8fa4cf" }}>
                    - {label}
                  </Link>
                );
              }

              if (normalized === "news" && canAccessNews) {
                return (
                  <Link key={domain._id} to="/dashboard/news" style={{ padding: "9px 10px", marginLeft: 14, fontSize: 13, textAlign: "left", textDecoration: "none", color: "#8fa4cf" }}>
                    - {label}
                  </Link>
                );
              }

              return (
                <div key={domain._id} style={{ padding: "9px 10px", marginLeft: 14, fontSize: 13, color: "#6f86b5" }}>
                  - {label}
                </div>
              );
            })}
            {(!currentUser || currentUser.role !== "admin") && canAccessProduct && <Link to="/dashboard/products" style={{ padding: "9px 10px", textAlign: "left", textDecoration: "none", color: "#aebee1", fontWeight: 500 }}>Products</Link>}
            {(!currentUser || currentUser.role !== "admin") && canAccessNews && <Link to="/dashboard/news" style={{ padding: "9px 10px", textAlign: "left", textDecoration: "none", color: "#aebee1", fontWeight: 500 }}>News</Link>}
            {currentUser && currentUser.role === "admin" && (
              <button onClick={() => setView("other")} style={{ padding: "9px 10px", textAlign: "left", background: view === "other" ? "linear-gradient(90deg, rgba(53,106,221,0.26) 0%, rgba(53,106,221,0.14) 100%)" : "transparent", border: view === "other" ? "1px solid rgba(93,141,238,0.45)" : "1px solid transparent", borderRadius: 8, cursor: "pointer", color: view === "other" ? "#d9e7ff" : "#aebee1", fontWeight: view === "other" ? 600 : 500 }}>Other</button>
            )}
          </nav>
          </div>
        </aside>

        <main className="admin-content" style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>
              Dashboard — {view === "home" ? "Home" : view === "users" ? "Users" : "Other"}
            </h2>
          </div>

          {/* Admin tools removed */}

          {view === "home" && currentUser && currentUser.role === "admin" && (
            <div style={{ padding: 12 }}>
              <h3>User status summary</h3>
              <p style={{ color: "#555" }}>Distribution of active vs inactive users</p>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  {users && users.length > 0 ? (
                    (() => {
                      const total = users.length;
                      const active = users.filter((x: any) => x.isActive).length;
                      const inactive = total - active;
                      const activePct = Math.round((active / total) * 100);
                      const inactivePct = 100 - activePct;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ position: 'relative', width: 140, height: 140 }}>
                            <div style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: `conic-gradient(#2ecc71 0% ${activePct}%, #e74c3c ${activePct}% 100%)`
                            }} />
                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: 18, fontWeight: 600 }}>{activePct}%</div>
                              <div style={{ fontSize: 12, color: '#555' }}>Active</div>
                            </div>
                          </div>
                          <div>
                            <div style={{ marginBottom: 6 }}><span style={{ color: '#2ecc71', fontWeight: 600 }}>●</span> Active: {active} ({activePct}%)</div>
                            <div><span style={{ color: '#e74c3c', fontWeight: 600 }}>●</span> Inactive: {inactive} ({inactivePct}%)</div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div>No users to summarize.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === "home" && currentUser && currentUser.role !== "admin" && (
            <div style={{ padding: 12 }}>
              <h3>My Content Summary</h3>
              <p style={{ color: "#555" }}>Distribution of your products and news</p>
              {(() => {
                const total = myProductCount + myNewsCount;
                const productPct = total > 0 ? Math.round((myProductCount / total) * 100) : 0;
                const newsPct = total > 0 ? 100 - productPct : 0;
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                    <div style={{ position: "relative", width: 140, height: 140 }}>
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: `conic-gradient(#3498db 0% ${productPct}%, #9b59b6 ${productPct}% 100%)`
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center"
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 600 }}>{total}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>Total</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ marginBottom: 6 }}><span style={{ color: "#3498db", fontWeight: 600 }}>●</span> Products: {myProductCount} ({productPct}%)</div>
                      <div><span style={{ color: "#9b59b6", fontWeight: 600 }}>●</span> News: {myNewsCount} ({newsPct}%)</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {view === "users" && (
            <>
              {currentUser && currentUser.role !== "admin" ? (
                <div style={{ padding: 12, color: "#555" }}>Only administrators can view the user list.</div>
              ) : (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 8 }}>Name</th>
                        <th style={{ textAlign: "left", padding: 8 }}>Email</th>
                        <th style={{ textAlign: "left", padding: 8 }}>Phone</th>
                        <th style={{ textAlign: "left", padding: 8 }}>Role</th>
                        <th style={{ textAlign: "left", padding: 8 }}>Verified</th>
                        <th style={{ textAlign: "left", padding: 8 }}>Active</th>
                        <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: 12 }}>No users found.</td>
                        </tr>
                      )}
                      {users.map((u: any) => (
                        <tr key={u._id}>
                          <td style={{ padding: 8 }}>
                            {editingId === u._id ? (
                              <input value={editValues.name} onChange={(e) => setEditValues((s: any) => ({ ...s, name: e.target.value }))} />
                            ) : (
                              <Link to={`/dashboard/users/${u._id}`} style={{ color: "#2458c6", textDecoration: "none", fontWeight: 600 }}>
                                {u.name}
                              </Link>
                            )}
                          </td>
                          <td style={{ padding: 8 }}>
                            {editingId === u._id ? (
                              <input value={editValues.email} onChange={(e) => setEditValues((s: any) => ({ ...s, email: e.target.value }))} />
                            ) : (
                              u.email
                            )}
                          </td>
                          <td style={{ padding: 8 }}>
                            {editingId === u._id ? (
                              <input value={editValues.phone} onChange={(e) => setEditValues((s: any) => ({ ...s, phone: e.target.value }))} />
                            ) : (
                              u.phone || "-"
                            )}
                          </td>
                          <td style={{ padding: 8 }}>
                            {editingId === u._id ? (
                              <select value={editValues.role} onChange={(e) => setEditValues((s: any) => ({ ...s, role: e.target.value }))}>
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                              </select>
                            ) : (
                              u.role
                            )}
                          </td>
                          <td style={{ padding: 8 }}>
                            {u.isVerified ? "Verified" : "Unverified"}
                            {currentUser && currentUser.role === "admin" && (
                              <button onClick={() => toggleVerified(u)} style={{ padding: '4px 8px', marginLeft: 8 }}>
                                {u.isVerified ? '🚫' : '✅'}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: 8 }}>
                            <span style={{ marginRight: 8 }}>{u.isActive ? "Active" : "Inactive"}</span>
                            {currentUser && currentUser.role === "admin" && (
                              <button onClick={() => toggleActive(u)} style={{ padding: '4px 8px' }}>
                                {u.isActive ? '⛔' : '🟢'}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: 8 }}>
                            {editingId === u._id ? (
                              <>
                                <button onClick={() => saveEdit(u._id)} style={{ marginRight: 8 }}>💾 Save</button>
                                <button onClick={cancelEdit}>✖ Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(u)} style={{ marginRight: 8 }}>✏️</button>
                                <button onClick={() => deleteUser(u._id)} style={{ color: "#c00" }}>🗑️</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* pagination controls */}
                  {pages > 1 && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        Previous
                      </button>
                      <span>
                        Page {page} of {pages}
                      </span>
                      <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {view === "other" && (
            <div style={{ display: "grid", gap: 20 }}>
              {message && <div style={{ color: "green" }}>{message}</div>}

              {currentUser && currentUser.role === "admin" && (
                <div style={{ display: "grid", gap: 10, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
                  <h3>Manage Categories (Admin)</h3>
                  <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                    <select
                      value={categoryForm.domainName}
                      onChange={(e) => setCategoryForm((s) => ({ ...s, domainName: e.target.value }))}
                    >
                      <option value="">Select domain</option>
                      {domains.map((domain: any) => (
                        <option key={domain._id} value={domain.name}>
                          {domain.displayName || domain.name}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Category name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((s) => ({ ...s, name: e.target.value }))}
                      disabled={!categoryForm.domainName}
                    />
                    <input
                      placeholder="Category description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm((s) => ({ ...s, description: e.target.value }))}
                    />
                    <button onClick={createCategory}>Create Category</button>
                  </div>

                  <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                    <input
                      placeholder="Subcategory name"
                      value={subcategoryForm.name}
                      onChange={(e) => setSubcategoryForm((s) => ({ ...s, name: e.target.value }))}
                    />
                    <input
                      placeholder="Subcategory description"
                      value={subcategoryForm.description}
                      onChange={(e) => setSubcategoryForm((s) => ({ ...s, description: e.target.value }))}
                    />
                    <select
                      value={subcategoryForm.category}
                      onChange={(e) => setSubcategoryForm((s) => ({ ...s, category: e.target.value }))}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat: any) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={createSubcategory}>Create Subcategory</button>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gap: 10, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
                <h3>Create Product</h3>
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
                  <input
                    placeholder="Title"
                    value={productForm.title}
                    onChange={(e) => setProductForm((s) => ({ ...s, title: e.target.value }))}
                  />
                  <input
                    placeholder="Price"
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm((s) => ({ ...s, price: e.target.value }))}
                  />
                  <input
                    placeholder="Stock"
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm((s) => ({ ...s, stock: e.target.value }))}
                  />
                  <input
                    placeholder="Currency"
                    value={productForm.currency}
                    onChange={(e) => setProductForm((s) => ({ ...s, currency: e.target.value }))}
                  />
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm((s) => ({ ...s, categoryId: e.target.value, subcategoryId: "" }))}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat: any) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={productForm.subcategoryId}
                    onChange={(e) => setProductForm((s) => ({ ...s, subcategoryId: e.target.value }))}
                  >
                    <option value="">Select subcategory</option>
                    {filteredProductSubcategories.map((sub: any) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(e) => setProductForm((s) => ({ ...s, description: e.target.value }))}
                  rows={3}
                />
                <button onClick={createProduct} style={{ width: "fit-content" }}>Save Product</button>
              </div>

              <div style={{ display: "grid", gap: 10, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
                <h3>Create News</h3>
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
                  <input
                    placeholder="Title"
                    value={newsForm.title}
                    onChange={(e) => setNewsForm((s) => ({ ...s, title: e.target.value }))}
                  />
                  <select
                    value={newsForm.categoryId}
                    onChange={(e) => setNewsForm((s) => ({ ...s, categoryId: e.target.value, subcategoryId: "" }))}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat: any) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newsForm.subcategoryId}
                    onChange={(e) => setNewsForm((s) => ({ ...s, subcategoryId: e.target.value }))}
                  >
                    <option value="">Select subcategory</option>
                    {filteredNewsSubcategories.map((sub: any) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="News content"
                  value={newsForm.content}
                  onChange={(e) => setNewsForm((s) => ({ ...s, content: e.target.value }))}
                  rows={4}
                />
                <button onClick={createNews} style={{ width: "fit-content" }}>Save News</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
