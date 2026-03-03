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
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px",
        borderBottom: "1px solid #1f2a3f",
        background: "linear-gradient(180deg, #0f172a 0%, #111c34 100%)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/" style={{ textDecoration: "none", color: "#e5edff", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #295fc9 0%, #5f8df0 100%)" }} />
          <h3 style={{ margin: 0, fontSize: 18 }}>AI Dynamic CRUD</h3>
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {!user && (
          <>
            <Link to="/login" style={{ textDecoration: "none", color: "#d7e2fb", fontWeight: 500 }}>Login</Link>
            <Link to="/register" style={{ textDecoration: "none", color: "#fff", background: "#2e63cd", padding: "7px 12px", borderRadius: 8 }}>Register</Link>
          </>
        )}

        {user && (
          <div ref={ref} style={{ position: "relative" }}>
            <button
              onClick={() => setOpen(o => !o)}
              aria-haspopup="true"
              aria-expanded={open}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "#1c2a47", border: "1px solid #2a3b62", borderRadius: 999, cursor: "pointer", padding: "6px 10px", color: "#e7efff" }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 18, background: "linear-gradient(135deg, #4a79de 0%, #6e95ec 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                {initials}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name || user.email}</div>
                <div style={{ fontSize: 11, color: "#b9c8ea" }}>{user.email}</div>
              </div>
            </button>

            {open && (
              <div style={{ position: "absolute", right: 0, top: 52, width: 240, background: "#fff", border: "1px solid #d9e4f6", borderRadius: 10, boxShadow: "0 14px 34px rgba(30, 58, 116, 0.14)", zIndex: 40 }}>
                <div style={{ padding: 12, borderBottom: "1px solid #eef3fb" }}>
                  <div style={{ fontWeight: 700 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: "#5f6b85" }}>{user.email}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", padding: 8 }}>
                  <button onClick={() => { setOpen(false); navigate("/change-password"); }} style={{ padding: 9, textAlign: "left", background: "none", border: "none", cursor: "pointer", borderRadius: 8 }}>Change password</button>
                  <button onClick={() => { setOpen(false); logout(); }} style={{ padding: 9, textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "#c00", borderRadius: 8 }}>Logout</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
