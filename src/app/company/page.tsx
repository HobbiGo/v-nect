
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Company = {
  id: string;
  owner_id: string;
  company_name: string;
  description: string | null;
  logo_url: string | null;
};

export default function CompanyDashboard() {
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    let mounted = true;

    async function loadCompany() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: settings, error: settingsError } =
          await supabase
            .from("account_settings")
            .select("active_profile_type, active_company_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (settingsError) throw settingsError;

        if (
          !settings ||
          settings.active_profile_type !== "company" ||
          !settings.active_company_id
        ) {
          if (mounted) setLoading(false);
          return;
        }

        const { data, error: companyError } = await supabase
          .from("companies")
          .select("id, owner_id, company_name, description, logo_url")
          .eq("id", settings.active_company_id)
          .eq("owner_id", user.id)
          .maybeSingle();

        if (companyError) throw companyError;

        if (!mounted) return;

        if (data) {
          const companyData = data as Company;

          setCompany(companyData);
          setCompanyName(companyData.company_name);
          setDescription(companyData.description || "");
          setLogoUrl(companyData.logo_url || "");
        }
      } catch (err) {
        console.error("Company loading error:", err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load your company profile."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCompany();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company) return;

    if (!companyName.trim()) {
      setError("Company name cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error: updateError } = await supabase
        .from("companies")
        .update({
          company_name: companyName.trim(),
          description: description.trim() || null,
          logo_url: logoUrl.trim() || null,
        })
        .eq("id", company.id)
        .eq("owner_id", user.id)
        .select("id, owner_id, company_name, description, logo_url")
        .single();

      if (updateError) throw updateError;

      const updatedCompany = data as Company;

      setCompany(updatedCompany);
      setCompanyName(updatedCompany.company_name);
      setDescription(updatedCompany.description || "");
      setLogoUrl(updatedCompany.logo_url || "");
      setEditing(false);
    } catch (err) {
      console.error("Company update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save company profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function switchToPersonal() {
    if (switching) return;

    setSwitching(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("account_settings")
        .update({
          active_profile_type: "personal",
          active_company_id: null,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      router.push("/dashboard");
    } catch (err) {
      console.error("Profile switching error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to switch to Personal Profile."
      );

      setSwitching(false);
    }
  }

  function cancelEditing() {
    if (!company) return;

    setCompanyName(company.company_name);
    setDescription(company.description || "");
    setLogoUrl(company.logo_url || "");
    setEditing(false);
    setError("");
  }

  function navigateTo(section: string) {
    setActiveSection(section);

    document.getElementById(section)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const profileCompletion = company
    ? Math.round(
        ([
          Boolean(company.company_name),
          Boolean(company.description),
          Boolean(company.logo_url),
        ].filter(Boolean).length /
          3) *
          100
      )
    : 0;

  if (loading) {
    return (
      <main className="loading-page">
        <div className="loading-card">
          <div className="loader" />
          <h2>v-nect</h2>
          <p>Loading Company Workspace...</p>
        </div>

        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #07111f;
            color: white;
            font-family: Arial, sans-serif;
          }
          .loading-card {
            text-align: center;
          }
          .loading-card h2 {
            letter-spacing: 2px;
            margin: 15px 0 8px;
          }
          .loading-card p {
            color: #9aa9bd;
            font-size: 13px;
          }
          .loader {
            width: 38px;
            height: 38px;
            border: 3px solid rgba(255,255,255,.15);
            border-top-color: #4f8cff;
            border-radius: 50%;
            animation: spin .8s linear infinite;
            margin: auto;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="empty-page">
        <div className="empty-card">
          <div className="empty-icon">🏢</div>
          <h1>No Company Selected</h1>
          <p>
            Please select or create a company profile from your
            Personal Dashboard first.
          </p>

          <Link href="/dashboard" className="primary-button">
            Go to Personal Dashboard
          </Link>
        </div>

        <style jsx>{`
          .empty-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #07111f;
            color: white;
            font-family: Arial, sans-serif;
          }
          .empty-card {
            width: 100%;
            max-width: 440px;
            padding: 36px;
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 20px;
            background: #101e32;
            text-align: center;
          }
          .empty-icon {
            font-size: 42px;
            margin-bottom: 16px;
          }
          .empty-card h1 {
            margin: 0 0 12px;
            font-size: 25px;
          }
          .empty-card p {
            color: #9aa9bd;
            line-height: 1.7;
            margin-bottom: 24px;
          }
          .primary-button {
            display: inline-block;
            padding: 12px 20px;
            border-radius: 10px;
            background: #4f8cff;
            color: white;
            text-decoration: none;
            font-weight: 600;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="company-page">
      <aside className="sidebar">
        <Link href="/company" className="brand">
          <span className="brand-mark">V</span>
          <span>v-nect</span>
        </Link>

        <div className="sidebar-label">COMPANY WORKSPACE</div>

        <nav>
          <button
            className={`nav-item ${activeSection === "overview" ? "active" : ""}`}
            onClick={() => navigateTo("overview")}
          >
            <span>▦</span> Overview
          </button>

          <button
            className={`nav-item ${activeSection === "profile" ? "active" : ""}`}
            onClick={() => navigateTo("profile")}
          >
            <span>◉</span> Company Profile
          </button>

          <button
            className={`nav-item ${activeSection === "business" ? "active" : ""}`}
            onClick={() => navigateTo("business")}
          >
            <span>▤</span> Business Modules
          </button>

          <button
            className={`nav-item ${activeSection === "settings" ? "active" : ""}`}
            onClick={() => navigateTo("settings")}
          >
            <span>⚙</span> Settings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="workspace-badge">
            <span className="status-dot" />
            Company Workspace
          </div>

          <button
            className="back-link"
            onClick={switchToPersonal}
            disabled={switching}
          >
            {switching ? "Switching..." : "← Switch to Personal"}
          </button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / Company</div>
            <h1>Company Dashboard</h1>
          </div>

          <div className="topbar-right">
            <div className="company-avatar">
              {company.logo_url ? (
                <img src={company.logo_url} alt="Company logo" />
              ) : (
                company.company_name.charAt(0).toUpperCase()
              )}
            </div>

            <span className="company-short-name">
              {company.company_name}
            </span>
          </div>
        </header>

        <div className="content">
          {error && <div className="error-message">{error}</div>}

          <section className="welcome-banner" id="overview">
            <div>
              <div className="eyebrow">WELCOME TO YOUR WORKSPACE</div>
              <h2>{company.company_name}</h2>
              <p>
                Manage your company presence, build your brand
                and grow your business with v-nect.
              </p>
            </div>

            <div className="banner-icon">🏢</div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">🏢</div>
              <div className="stat-label">WORKSPACE</div>
              <div className="stat-value">Active</div>
              <div className="stat-note">
                Your company workspace
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon teal">◉</div>
              <div className="stat-label">PROFILE STATUS</div>
              <div className="stat-value">{profileCompletion}%</div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">◇</div>
              <div className="stat-label">BUSINESS MODULES</div>
              <div className="stat-value">04</div>
              <div className="stat-note">
                Connected ecosystem modules
              </div>
            </div>
          </section>

          <section className="section-heading" id="profile">
            <div>
              <div className="section-eyebrow">COMPANY IDENTITY</div>
              <h2>Company Profile</h2>
              <p>
                Manage how your company appears across v-nect.
              </p>
            </div>

            {!editing && (
              <button
                className="edit-button"
                onClick={() => {
                  setError("");
                  setEditing(true);
                }}
              >
                ✎ Edit Profile
              </button>
            )}
          </section>

          <section className="profile-card">
            <div className="profile-header">
              <div className="large-avatar">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="Company logo" />
                ) : (
                  company.company_name.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <div className="profile-label">COMPANY NAME</div>
                <h3>{company.company_name}</h3>
                <span className="profile-status">
                  ● Active Company
                </span>
              </div>
            </div>

            <div className="profile-divider" />

            {editing ? (
              <form className="edit-form" onSubmit={saveCompany}>
                <label htmlFor="companyName">Company Name</label>
                <input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  maxLength={150}
                  required
                />

                <label htmlFor="description">Company Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people about your company..."
                  rows={5}
                  maxLength={2000}
                />

                <label htmlFor="logoUrl">Company Logo URL</label>
                <input
                  id="logoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />

                <p className="form-hint">
                  Enter a publicly accessible image URL.
                  Storage upload can be added in a later stage.
                </p>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-button"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="details-grid">
                <div className="detail-item">
                  <span>Company Name</span>
                  <strong>{company.company_name}</strong>
                </div>

                <div className="detail-item">
                  <span>Company Description</span>
                  <p>
                    {company.description ||
                      "No company description added yet."}
                  </p>
                </div>

                <div className="detail-item">
                  <span>Company Logo</span>
                  <p>
                    {company.logo_url
                      ? "Company logo added."
                      : "No company logo added yet."}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section
            className="section-heading modules-heading"
            id="business"
          >
            <div>
              <div className="section-eyebrow">v-nect ECOSYSTEM</div>
              <h2>Business Modules</h2>
              <p>
                Your company's connected business tools.
              </p>
            </div>
          </section>

          <section className="module-grid">
            <div className="module-card">
              <div className="module-icon blue">◉</div>
              <h3>VOIN Business</h3>
              <p>
                Manage your company identity and business presence.
              </p>
              <span className="module-status active-status">
                Workspace Active
              </span>
            </div>

            <Link
              href="/business-feed"
              className="module-card module-link"
            >
              <div className="module-icon teal">▤</div>
              <h3>VOIN Business Feed</h3>
              <p>
                Publish company announcements, news and updates.
              </p>
              <span className="module-status active-status">
                ● Active · Open Business Feed →
              </span>
            </Link>

            <div className="module-card">
              <div className="module-icon purple">◇</div>
              <h3>VOIN Product Room</h3>
              <p>
                Present your products and services to the community.
              </p>
              <span className="module-status planned">
                Coming Soon
              </span>
            </div>

            <div className="module-card">
              <div className="module-icon orange">◎</div>
              <h3>VOIN Community</h3>
              <p>
                Connect your company with communities and people.
              </p>
              <span className="module-status planned">
                Coming Soon
              </span>
            </div>
          </section>

          <section className="settings-card" id="settings">
            <div>
              <div className="section-eyebrow">
                ACCOUNT MANAGEMENT
              </div>
              <h2>Workspace Settings</h2>
              <p>
                Manage your active profile and workspace access.
              </p>
            </div>

            <button
              className="switch-button"
              onClick={switchToPersonal}
              disabled={switching}
            >
              {switching
                ? "Switching Profile..."
                : "← Switch to Personal Profile"}
            </button>
          </section>

          <footer>
            © 2026 v-nect. Connect Beyond Boundaries.
          </footer>
        </div>
      </section>

      <style jsx>{`
        .company-page {
          min-height: 100vh;
          display: flex;
          background: #f3f6fb;
          color: #17243a;
          font-family: Arial, sans-serif;
        }

        .sidebar {
          width: 250px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 28px 18px;
          display: flex;
          flex-direction: column;
          background: #07111f;
          color: #f5f7fb;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: white;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: 1px;
          text-decoration: none;
          padding: 0 8px;
        }

        .brand-mark {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f8cff, #13c8b5);
        }

        .sidebar-label {
          margin: 48px 8px 16px;
          color: #71839b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        nav {
          display: grid;
          gap: 8px;
        }

        .nav-item {
          width: 100%;
          padding: 13px 12px;
          border: 0;
          border-radius: 9px;
          color: #9aa9bd;
          background: transparent;
          text-decoration: none;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }

        .nav-item span {
          margin-right: 10px;
        }

        .nav-item.active,
        .nav-item:hover {
          background: rgba(79, 140, 255, 0.16);
          color: #75a8ff;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .workspace-badge {
          padding: 12px 9px;
          border-radius: 9px;
          background: rgba(255,255,255,.06);
          color: #c3cede;
          font-size: 11px;
          margin-bottom: 18px;
        }

        .status-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          margin-right: 8px;
          border-radius: 50%;
          background: #13c8b5;
        }

        .back-link {
          width: 100%;
          padding: 9px;
          border: 0;
          background: transparent;
          color: #8fa1b8;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
        }

        .back-link:disabled {
          opacity: .6;
          cursor: wait;
        }

        .main-content {
          flex: 1;
          min-width: 0;
        }

        .topbar {
          min-height: 90px;
          padding: 20px 38px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border-bottom: 1px solid #e6ebf2;
        }

        .breadcrumb {
          color: #8492a6;
          font-size: 11px;
          margin-bottom: 7px;
        }

        .topbar h1 {
          font-size: 21px;
          margin: 0;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .company-avatar,
        .large-avatar {
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f8cff, #13c8b5);
          color: white;
          font-weight: 800;
        }

        .company-avatar {
          width: 38px;
          height: 38px;
        }

        .company-avatar img,
        .large-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .content {
          max-width: 1250px;
          margin: auto;
          padding: 32px 38px;
        }

        .welcome-banner {
          min-height: 180px;
          padding: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 17px;
          background: linear-gradient(120deg, #102e58, #2356a0);
          color: white;
          overflow: hidden;
          scroll-margin-top: 25px;
        }

        .eyebrow {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #a9c9ff;
          font-weight: 700;
          margin-bottom: 13px;
        }

        .welcome-banner h2 {
          font-size: 29px;
          margin: 0 0 10px;
        }

        .welcome-banner p {
          max-width: 500px;
          color: #d1e1fa;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        .banner-icon {
          font-size: 65px;
          opacity: .85;
          padding: 0 25px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .stat-card {
          padding: 20px;
          border: 1px solid #e8edf4;
          border-radius: 13px;
          background: white;
        }

        .stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          margin-bottom: 15px;
        }

        .blue {
          background: #e8f0ff;
          color: #3979e8;
        }

        .teal {
          background: #e4f9f5;
          color: #0caa91;
        }

        .purple {
          background: #f0eaff;
          color: #895bd8;
        }

        .orange {
          background: #fff1e4;
          color: #dc8737;
        }

        .stat-label {
          color: #8996a9;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 800;
          margin: 7px 0;
        }

        .stat-note {
          color: #8492a6;
          font-size: 10px;
        }

        .progress-track {
          height: 5px;
          margin-top: 12px;
          border-radius: 10px;
          background: #edf1f7;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(90deg, #4f8cff, #13c8b5);
        }

        .section-heading {
          margin: 34px 0 17px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          scroll-margin-top: 25px;
        }

        .section-eyebrow {
          color: #4988d8;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 7px;
        }

        .section-heading h2,
        .settings-card h2 {
          font-size: 18px;
          margin: 0 0 7px;
        }

        .section-heading p,
        .settings-card p {
          color: #8492a6;
          font-size: 12px;
          margin: 0;
          line-height: 1.6;
        }

        .edit-button,
        .save-button,
        .cancel-button,
        .switch-button {
          padding: 10px 16px;
          border: 0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .edit-button,
        .save-button,
        .switch-button {
          color: white;
          background: #3979e8;
        }

        .profile-card,
        .module-card,
        .settings-card {
          background: white;
          border: 1px solid #e8edf4;
          border-radius: 13px;
          box-shadow: 0 4px 16px rgba(23,36,58,.03);
        }

        .profile-card {
          padding: 25px;
          scroll-margin-top: 25px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 17px;
        }

        .large-avatar {
          width: 62px;
          height: 62px;
          font-size: 25px;
        }

        .profile-label {
          color: #8b99ad;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 7px;
        }

        .profile-header h3 {
          margin: 0 0 7px;
          font-size: 19px;
        }

        .profile-status {
          color: #13a88f;
          font-size: 11px;
        }

        .profile-divider {
          height: 1px;
          background: #edf0f5;
          margin: 23px 0;
        }

        .details-grid {
          display: grid;
          gap: 20px;
        }

        .detail-item span {
          display: block;
          color: #8996a9;
          font-size: 11px;
          margin-bottom: 8px;
        }

        .detail-item strong {
          font-size: 13px;
        }

        .detail-item p {
          color: #596a80;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        .edit-form {
          display: grid;
          gap: 10px;
        }

        .edit-form label {
          margin-top: 7px;
          font-size: 12px;
          font-weight: 700;
        }

        .edit-form input,
        .edit-form textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #dce4ef;
          border-radius: 8px;
          background: #fbfcfe;
          color: #17243a;
          font: inherit;
          font-size: 13px;
          outline-color: #4f8cff;
          box-sizing: border-box;
        }

        .edit-form textarea {
          resize: vertical;
        }

        .form-hint {
          color: #8492a6;
          font-size: 10px;
          line-height: 1.6;
          margin: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 12px;
        }

        .cancel-button {
          background: #edf1f7;
          color: #53647a;
        }

        .save-button:disabled,
        .switch-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .error-message {
          padding: 12px 15px;
          margin-bottom: 14px;
          border-radius: 8px;
          background: #fff0f0;
          color: #bd3434;
          font-size: 12px;
        }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .module-card {
          padding: 21px;
        }

        .module-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          font-size: 19px;
          margin-bottom: 15px;
        }

        .module-card h3 {
          font-size: 14px;
          margin: 0 0 8px;
        }

        .module-card p {
          min-height: 38px;
          color: #8492a6;
          font-size: 11px;
          line-height: 1.7;
          margin: 0 0 13px;
        }

        .module-status {
          font-size: 10px;
          font-weight: 700;
        }

        .active-status {
          color: #0d9e83;
        }

        .planned {
          color: #8a96a8;
        }

        /* Active Business Feed card */
        .module-link {
          display: block;
          color: inherit;
          text-decoration: none;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .module-link:hover {
          transform: translateY(-3px);
          border-color: #4f8cff;
          box-shadow: 0 8px 24px rgba(57, 121, 232, .12);
        }

        .module-link:active {
          transform: scale(.98);
        }

        .module-link:focus-visible {
          outline: 3px solid #4f8cff;
          outline-offset: 3px;
        }

        .settings-card {
          margin-top: 30px;
          padding: 23px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          scroll-margin-top: 25px;
        }

        footer {
          padding: 35px 0 10px;
          color: #9aa6b6;
          font-size: 10px;
          text-align: center;
        }

        @media (max-width: 850px) {
          .sidebar {
            width: 205px;
          }

          .content {
            padding: 25px 22px;
          }

          .topbar {
            padding: 18px 22px;
          }
        }

        @media (max-width: 600px) {
          .company-page {
            display: block;
          }

          .sidebar {
            width: auto;
            min-height: auto;
            padding: 15px 17px;
          }

          .brand {
            font-size: 17px;
          }

          .sidebar-label {
            margin: 20px 8px 9px;
          }

          nav {
            display: flex;
            flex-wrap: wrap;
          }

          .nav-item {
            width: auto;
            padding: 10px;
            font-size: 11px;
          }

          .sidebar-bottom {
            margin-top: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .workspace-badge {
            margin: 0;
            padding: 9px;
            font-size: 10px;
          }

          .topbar {
            min-height: 75px;
            padding: 15px 17px;
          }

          .topbar h1 {
            font-size: 17px;
          }

          .company-short-name {
            display: none;
          }

          .content {
            padding: 20px 15px;
          }

          .welcome-banner {
            min-height: 150px;
            padding: 22px;
          }

          .welcome-banner h2 {
            font-size: 23px;
          }

          .welcome-banner p {
            font-size: 11px;
          }

          .banner-icon {
            font-size: 43px;
            padding: 0 0 0 10px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .stat-card {
            padding: 16px;
          }

          .section-heading {
            align-items: flex-start;
          }

          .section-heading h2 {
            font-size: 16px;
          }

          .edit-button {
            padding: 9px;
            white-space: nowrap;
            font-size: 10px;
          }

          .profile-card {
            padding: 18px;
          }

          .module-grid {
            grid-template-columns: 1fr;
          }

          .module-card p {
            min-height: auto;
          }

          .module-link {
            min-height: 44px;
            -webkit-tap-highlight-color: rgba(79, 140, 255, .12);
          }

          .settings-card {
            flex-direction: column;
            align-items: stretch;
          }

          .switch-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
