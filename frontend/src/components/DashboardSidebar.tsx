import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import contentService from "../services/contentService";

export default function DashboardSidebar() {
  const [domains, setDomains] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState({
    domains: false,
    categories: false,
    subcategories: false,
  });

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
  const canAccessNews = isAdmin || domainPermissions.includes("news");

  useEffect(() => {
    const loadDomains = async () => {
      try {
        const docs = await contentService.getDomains();
        setDomains(docs || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (isAdmin) loadDomains();
  }, [isAdmin]);

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: "9px 10px",
    textAlign: "left" as const,
    background: isActive ? "linear-gradient(90deg, rgba(53,106,221,0.26) 0%, rgba(53,106,221,0.14) 100%)" : "transparent",
    border: isActive ? "1px solid rgba(93,141,238,0.45)" : "1px solid transparent",
    textDecoration: "none",
    color: isActive ? "#d9e7ff" : "#aebee1",
    borderRadius: 8,
    fontWeight: isActive ? 600 : 500,
  });

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
    <aside style={{ width: 230 }}>
      <div style={{ border: "1px solid #1f2a3f", borderRadius: 12, padding: 12, background: "linear-gradient(180deg, #0f172a 0%, #111c34 100%)", boxShadow: "0 12px 28px rgba(9, 16, 30, 0.35)" }}>
      <div style={{ fontSize: 12, color: "#7f91ba", marginBottom: 8, fontWeight: 700, letterSpacing: 0.4 }}>NAVIGATION</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <NavLink to="/dashboard" end style={linkStyle}>Home</NavLink>
        {isAdmin && <NavLink to="/dashboard/users" style={linkStyle}>Users</NavLink>}
        {isAdmin && (
          <>
            <button type="button" style={groupButtonStyle} onClick={() => toggleSection("domains")}>
              <span>Domains</span>
              <span>{openSections.domains ? "▾" : "▸"}</span>
            </button>
            {openSections.domains && (
              <>
                <NavLink to="/dashboard/domains" style={({ isActive }) => ({ ...linkStyle({ isActive }), marginLeft: 14, fontSize: 13, color: isActive ? "#d9e7ff" : "#8fa4cf" })}>- Manage Domains</NavLink>
                {domains.map((domain: any) => {
                  const normalized = String(domain.name || "").toLowerCase();
                  const label = domain.displayName || domain.name;

                  if (normalized === "product" && canAccessProduct) {
                    return (
                      <NavLink
                        key={domain._id}
                        to="/dashboard/products"
                        style={({ isActive }) => ({ ...linkStyle({ isActive }), marginLeft: 14, fontSize: 13, color: isActive ? "#d9e7ff" : "#8fa4cf" })}
                      >
                        - {label}
                      </NavLink>
                    );
                  }

                  if (normalized === "news" && canAccessNews) {
                    return (
                      <NavLink
                        key={domain._id}
                        to="/dashboard/news"
                        style={({ isActive }) => ({ ...linkStyle({ isActive }), marginLeft: 14, fontSize: 13, color: isActive ? "#d9e7ff" : "#8fa4cf" })}
                      >
                        - {label}
                      </NavLink>
                    );
                  }

                  return (
                    <div key={domain._id} style={{ padding: "9px 10px", marginLeft: 14, fontSize: 13, color: "#6f86b5" }}>
                      - {label}
                    </div>
                  );
                })}
              </>
            )}

            <button type="button" style={groupButtonStyle} onClick={() => toggleSection("categories")}>
              <span>Categories</span>
              <span>{openSections.categories ? "▾" : "▸"}</span>
            </button>
            {openSections.categories && (
              <NavLink to="/dashboard/categories" style={({ isActive }) => ({ ...linkStyle({ isActive }), marginLeft: 14, fontSize: 13, color: isActive ? "#d9e7ff" : "#8fa4cf" })}>- Manage Categories</NavLink>
            )}

            <button type="button" style={groupButtonStyle} onClick={() => toggleSection("subcategories")}>
              <span>Subcategories</span>
              <span>{openSections.subcategories ? "▾" : "▸"}</span>
            </button>
            {openSections.subcategories && (
              <NavLink to="/dashboard/subcategories" style={({ isActive }) => ({ ...linkStyle({ isActive }), marginLeft: 14, fontSize: 13, color: isActive ? "#d9e7ff" : "#8fa4cf" })}>- Manage Subcategories</NavLink>
            )}
          </>
        )}
        {!isAdmin && canAccessProduct && <NavLink to="/dashboard/products" style={linkStyle}>Products</NavLink>}
        {!isAdmin && canAccessNews && <NavLink to="/dashboard/news" style={linkStyle}>News</NavLink>}
      </nav>
      </div>
    </aside>
  );
}
