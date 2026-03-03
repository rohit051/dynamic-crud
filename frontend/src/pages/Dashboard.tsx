import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [limit] = useState<number>(10);
  const navigate = useNavigate();

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  })();

  // default view: admin users land on Home, others on Other
  const initialView: "home" | "users" | "other" = currentUser && currentUser.role === "admin" ? "home" : "other";
  const [view, setView] = useState<"home" | "users" | "other">(initialView);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  useEffect(() => {
    if (currentUser && currentUser.role === "admin") {
      fetchUsers(page);
    }
  }, [page]);

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

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 16 }}>
        <aside style={{ width: 200, borderRight: "1px solid #eee", paddingRight: 12 }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {currentUser && currentUser.role === "admin" && (
              <button onClick={() => setView("home")} style={{ padding: 8, textAlign: "left", background: view === "home" ? "#eef" : "none", border: "none", cursor: "pointer" }}>Home</button>
            )}
            {currentUser && currentUser.role === "admin" && (
              <button onClick={() => setView("users")} style={{ padding: 8, textAlign: "left", background: view === "users" ? "#eef" : "none", border: "none", cursor: "pointer" }}>Users</button>
            )}
            <button onClick={() => setView("other")} style={{ padding: 8, textAlign: "left", background: view === "other" ? "#eef" : "none", border: "none", cursor: "pointer" }}>Other</button>
          </nav>
        </aside>

        <main style={{ flex: 1 }}>
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
                              u.name
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
                            {u.isVerified ? "✓ Yes" : "✗ No"}
                            {currentUser && currentUser.role === "admin" && (
                              <button onClick={() => toggleVerified(u)} style={{ padding: '4px 8px', marginLeft: 8 }}>
                                {u.isVerified ? 'Unverify' : 'Verify'}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: 8 }}>
                            <span style={{ marginRight: 8 }}>{u.isActive ? "Yes" : "No"}</span>
                            {currentUser && currentUser.role === "admin" && (
                              <button onClick={() => toggleActive(u)} style={{ padding: '4px 8px' }}>
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: 8 }}>
                            {editingId === u._id ? (
                              <>
                                <button onClick={() => saveEdit(u._id)} style={{ marginRight: 8 }}>Save</button>
                                <button onClick={cancelEdit}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(u)} style={{ marginRight: 8 }}>Edit</button>
                                <button onClick={() => deleteUser(u._id)} style={{ color: "#c00" }}>Delete</button>
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
        </main>
      </div>
    </div>
  );
}
