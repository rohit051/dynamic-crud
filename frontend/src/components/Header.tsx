import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);

  const location = useLocation();

  useEffect(() => {
    const readUser = () => {
      const cur = localStorage.getItem("currentUser");
      try {
        setUser(cur ? JSON.parse(cur) : null);
      } catch (e) {
        setUser(null);
      }
    };

    // read initially and whenever location changes
    readUser();

    // update when storage changes (other tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "currentUser") readUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [location]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((s: string) => s[0]).slice(0,2).join("")
    : "U";

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #eee" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ margin: 0 }}>AI Dynamic CRUD</h3>
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {!user && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}

        {user && (
          <div ref={ref} style={{ position: "relative" }}>
            <button
              onClick={() => setOpen(o => !o)}
              aria-haspopup="true"
              aria-expanded={open}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 18, background: "#4a90e2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                {initials}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14 }}>{user.name || user.email}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{user.email}</div>
              </div>
            </button>

            {open && (
              <div style={{ position: "absolute", right: 0, top: 48, width: 220, background: "#fff", border: "1px solid #ddd", borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,0.06)", zIndex: 40 }}>
                <div style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{user.email}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", padding: 8 }}>
                  <button onClick={() => { setOpen(false); navigate("/change-password"); }} style={{ padding: 8, textAlign: "left", background: "none", border: "none", cursor: "pointer" }}>Change password</button>
                  <button onClick={() => { setOpen(false); logout(); }} style={{ padding: 8, textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "#c00" }}>Logout</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
