import React, { useEffect, useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import contentService from "../services/contentService";
import userService from "../services/userService";

export default function DomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");

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
      const [domainDocs, usersRes] = await Promise.all([
        contentService.getDomains(),
        userService.getAll(1, 200),
      ]);
      setDomains(domainDocs || []);
      setUsers(usersRes?.docs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createDomain = async () => {
    try {
      if (!name.trim()) return alert("Domain name is required");
      await contentService.createDomain({ name: name.trim(), displayName: displayName.trim() || undefined });
      setName("");
      setDisplayName("");
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create domain");
    }
  };

  const togglePermission = async (user: any, domainName: string) => {
    try {
      const existing = Array.isArray(user.domainPermissions) ? user.domainPermissions.map((item: string) => String(item).toLowerCase()) : [];
      const normalized = String(domainName).toLowerCase();
      const next = existing.includes(normalized)
        ? existing.filter((item: string) => item !== normalized)
        : [...existing, normalized];

      await userService.update(user._id, { domainPermissions: next });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update permission");
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
        <DashboardSidebar />
        <main className="admin-content" style={{ flex: 1 }}>
          <h2>Domains</h2>
          <p style={{ color: "#666" }}>Only admin can manage domains and permissions.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ padding: 20, display: "flex", gap: 16 }}>
      <DashboardSidebar />
      <main className="admin-content" style={{ flex: 1 }}>
        <h2>Domains</h2>
        <p style={{ color: "#555" }}>Create domains like product/news and grant user access.</p>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr auto", marginBottom: 16 }}>
          <input placeholder="Domain name (e.g. product, news)" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <button onClick={createDomain}>Create Domain</button>
        </div>

        <h3>Created Domains</h3>
        <ul>
          {domains.length === 0 && <li>No domains found.</li>}
          {domains.map((domain: any) => (
            <li key={domain._id}>{domain.displayName || domain.name} ({domain.name})</li>
          ))}
        </ul>

        <h3 style={{ marginTop: 20 }}>Grant Access</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8 }}>User</th>
              {domains.map((domain: any) => (
                <th key={domain._id} style={{ textAlign: "left", padding: 8 }}>{domain.displayName || domain.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={Math.max(2, domains.length + 1)} style={{ padding: 8 }}>No users found.</td>
              </tr>
            )}
            {users.map((user: any) => {
              const perms = Array.isArray(user.domainPermissions)
                ? user.domainPermissions.map((item: string) => String(item).toLowerCase())
                : [];
              return (
                <tr key={user._id}>
                  <td style={{ padding: 8 }}>{user.name} ({user.email})</td>
                  {domains.map((domain: any) => {
                    const domainName = String(domain.name || "").toLowerCase();
                    const checked = perms.includes(domainName);
                    return (
                      <td key={`${user._id}-${domain._id}`} style={{ padding: 8 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(user, domainName)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </div>
  );
}
