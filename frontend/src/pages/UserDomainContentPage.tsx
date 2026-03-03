import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import userService from "../services/userService";
import contentService from "../services/contentService";

export default function UserDomainContentPage() {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [productItems, setProductItems] = useState<any[]>([]);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  })();

  const isAdmin = currentUser && currentUser.role === "admin";

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const [userDoc, domainDocs, products, news] = await Promise.all([
          userService.getById(id),
          contentService.getDomains(),
          contentService.getProducts(),
          contentService.getNews(),
        ]);

        setUser(userDoc || null);
        setDomains(domainDocs || []);

        const userId = String(userDoc?._id || "");
        setProductItems((products || []).filter((item: any) => String(item.createdBy) === userId));
        setNewsItems((news || []).filter((item: any) => String(item.createdBy) === userId));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const domainLabel = (name: string) => {
    const found = domains.find((item: any) => String(item.name).toLowerCase() === String(name).toLowerCase());
    return found?.displayName || name;
  };

  const itemsForDomain = (domainName: string) => {
    const normalized = String(domainName || "").toLowerCase();
    if (normalized === "product") return productItems.map((item: any) => item.title || "Untitled product");
    if (normalized === "news") return newsItems.map((item: any) => item.title || "Untitled news");
    return [];
  };

  if (!isAdmin) {
    return (
      <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
        <DashboardSidebar />
        <main className="admin-content" style={{ flex: 1 }}>
          <h2>User Domains & Content</h2>
          <p style={{ color: "#666" }}>Only administrators can view this page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
      <DashboardSidebar />
      <main className="admin-content" style={{ flex: 1 }}>
        <div style={{ marginBottom: 12 }}>
          <Link to="/dashboard/users" style={{ textDecoration: "none" }}>← Back to Users</Link>
        </div>
        <h2>User Domains & Content</h2>

        {loading ? (
          <p>Loading...</p>
        ) : !user ? (
          <p style={{ color: "#666" }}>User not found.</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ border: "1px solid #e5ebf7", borderRadius: 10, padding: 12, background: "#fff" }}>
              <div style={{ fontWeight: 700 }}>{user.name}</div>
              <div style={{ color: "#667", fontSize: 14 }}>{user.email}</div>
            </div>

            {Array.isArray(user.domainPermissions) && user.domainPermissions.length > 0 ? (
              user.domainPermissions.map((domainName: string) => {
                const items = itemsForDomain(domainName);
                return (
                  <div key={domainName} style={{ border: "1px solid #e5ebf7", borderRadius: 10, padding: 12, background: "#fff" }}>
                    <h3 style={{ marginTop: 0, marginBottom: 8 }}>{domainLabel(domainName)}</h3>
                    {items.length === 0 ? (
                      <p style={{ margin: 0, color: "#666" }}>No created items in this domain.</p>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {items.map((title: string, idx: number) => (
                          <li key={`${domainName}-${idx}`}>{title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ color: "#666" }}>No domain permissions assigned.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
