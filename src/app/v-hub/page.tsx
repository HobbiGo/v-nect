"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { AccountAuthModal } from "@/components/AccountAuthModal";

type HubCompany = {
  id: string;
  company_name: string;
  logo_url: string | null;
  industry?: string | null;
  description?: string | null;
  location?: string | null;
};

type FollowEntity = {
  id: string;
  name: string;
  handle: string;
  entityType: "personal" | "company";
  subtitle: string;
  destinationHref: string;
  destinationLabel: string;
};

type RecentPostActivity = {
  id: string;
  title: string;
  post_type: string;
  created_at: string;
  companies: {
    company_name: string;
  } | null;
};

type HubIdentityNote = {
  headline: string;
  summary: string;
  focusAreas: string;
};

const HUB_NOTE_STORAGE_KEY = "v-nect_v_hub_identity_v1";
const FOLLOWS_STORAGE_KEY = "v-nect_v_hub_follows_v1";

const DEFAULT_PERSONAL_PROFILES: FollowEntity[] = [
  {
    id: "personal-sophia",
    name: "Sophia Lee",
    handle: "@sophialee",
    entityType: "personal",
    subtitle: "Co-Founder & Product Lead · Personal Profile",
    destinationHref: "/v-circle",
    destinationLabel: "Connect in Circle →",
  },
  {
    id: "personal-james",
    name: "James Carter",
    handle: "@jamescarter",
    entityType: "personal",
    subtitle: "Head of Strategic Partnerships · Personal Profile",
    destinationHref: "/v-circle",
    destinationLabel: "Connect in Circle →",
  },
  {
    id: "personal-noah",
    name: "Noah Smith",
    handle: "@noahsmith",
    entityType: "personal",
    subtitle: "Full-Stack Platform Engineer · Personal Profile",
    destinationHref: "/v-circle",
    destinationLabel: "Connect in Circle →",
  },
];

export default function VHubPage() {
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [activeProfileType, setActiveProfileType] = useState<string>("personal");
  const [activeCompany, setActiveCompany] = useState<HubCompany | null>(null);
  const [allCompanies, setAllCompanies] = useState<HubCompany[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPostActivity[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dbSyncActive, setDbSyncActive] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);

  const [followedIds, setFollowedIds] = useState<string[]>(["personal-sophia"]);
  const [followFilter, setFollowFilter] = useState<"all" | "company" | "personal">("all");
  const [activityLog, setActivityLog] = useState<string[]>([
    "Membuka dashboard v-hub & sinkronisasi aktivitas ekosistem.",
  ]);

  const [identityNote, setIdentityNote] = useState<HubIdentityNote>({
    headline: "Global Business & Collaboration Hub",
    summary:
      "Unified identity space connecting personal credentials, company profiles, live feeds, and partner networks.",
    focusAreas: "B2B Partnerships, Video Commerce, Regional Expansion",
  });
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    try {
      const rawNote = window.localStorage.getItem(HUB_NOTE_STORAGE_KEY);
      if (rawNote) {
        const parsed = JSON.parse(rawNote);
        if (parsed && typeof parsed === "object") {
          setIdentityNote((prev) => ({
            headline: typeof parsed.headline === "string" ? parsed.headline : prev.headline,
            summary: typeof parsed.summary === "string" ? parsed.summary : prev.summary,
            focusAreas:
              typeof parsed.focusAreas === "string" ? parsed.focusAreas : prev.focusAreas,
          }));
        }
      }

      const rawFollows = window.localStorage.getItem(FOLLOWS_STORAGE_KEY);
      if (rawFollows) {
        const parsedFollows = JSON.parse(rawFollows);
        if (Array.isArray(parsedFollows)) {
          setFollowedIds(parsedFollows.filter((x): x is string => typeof x === "string"));
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  function pushActivity(text: string) {
    const timeStr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setActivityLog((prev) => [`[${timeStr}] ${text}`, ...prev.slice(0, 7)]);
  }

  async function loadUserIdentityFromDb(uid: string) {
    const { data, error } = await supabase
      .from("v_hub_identities")
      .select("headline, summary, focus_areas")
      .eq("user_id", uid)
      .maybeSingle();

    if (!error) {
      setDbSyncActive(true);
      if (data) {
        setIdentityNote({
          headline: data.headline || "Global Business & Collaboration Hub",
          summary:
            data.summary ||
            "Unified identity space connecting personal credentials, company profiles, live feeds, and partner networks.",
          focusAreas:
            data.focus_areas || "B2B Partnerships, Video Commerce, Regional Expansion",
        });
      }
    }
  }

  async function loadUserFollowsFromDb(uid: string) {
    const { data, error } = await supabase
      .from("v_follows")
      .select("target_key")
      .eq("user_id", uid);

    if (!error && Array.isArray(data)) {
      setDbSyncActive(true);
      if (data.length > 0) {
        setFollowedIds(data.map((r) => r.target_key));
      }
    }
  }

  async function syncHubData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: companiesList } = await supabase
      .from("companies")
      .select("id, company_name, logo_url, industry, description, location")
      .order("created_at", { ascending: false })
      .limit(12);

    if (Array.isArray(companiesList)) {
      setAllCompanies(companiesList as HubCompany[]);
    }

    const { data: postsList } = await supabase
      .from("business_posts")
      .select(`
        id,
        title,
        post_type,
        created_at,
        companies (
          company_name
        )
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5);

    if (Array.isArray(postsList)) {
      setRecentPosts(postsList as unknown as RecentPostActivity[]);
    }

    if (!user) {
      setCurrentUserId(null);
      setCurrentUserEmail(null);
      setCurrentUserName(null);
      setActiveProfileType("personal");
      setActiveCompany(null);
      setDbSyncActive(false);
      return;
    }

    setCurrentUserId(user.id);
    setCurrentUserEmail(user.email || null);

    const fallbackName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "Member";
    setCurrentUserName(fallbackName);

    const { data: settings } = await supabase
      .from("account_settings")
      .select("active_profile_type, active_company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const profileType = settings?.active_profile_type || "personal";
    setActiveProfileType(profileType);

    if (settings?.active_company_id) {
      const { data: comp } = await supabase
        .from("companies")
        .select("id, company_name, logo_url, industry, description, location")
        .eq("id", settings.active_company_id)
        .maybeSingle();

      if (comp) {
        setActiveCompany(comp as HubCompany);
        if (profileType === "company") {
          setCurrentUserName(comp.company_name);
        }
      }
    } else {
      setActiveCompany(null);
    }

    await loadUserIdentityFromDb(user.id);
    await loadUserFollowsFromDb(user.id);
  }

  useEffect(() => {
    let active = true;
    syncHubData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (active) {
        syncHubData();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    setCurrentUserEmail(null);
    setCurrentUserName(null);
    setActiveCompany(null);
    setDbSyncActive(false);
  }

  async function handleSaveIdentity(e: React.FormEvent) {
    e.preventDefault();
    setSavingIdentity(true);

    try {
      window.localStorage.setItem(HUB_NOTE_STORAGE_KEY, JSON.stringify(identityNote));
    } catch {
      // Ignore storage errors
    }

    if (currentUserId) {
      const { error } = await supabase.from("v_hub_identities").upsert(
        {
          user_id: currentUserId,
          headline: identityNote.headline.trim(),
          summary: identityNote.summary.trim(),
          focus_areas: identityNote.focusAreas.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      setSavingIdentity(false);
      if (!error) {
        setDbSyncActive(true);
        setSavedNotice("Ringkasan identitas v-hub tersimpan ke Supabase.");
        pushActivity(`Memperbarui headline v-hub: "${identityNote.headline.trim()}"`);
      } else {
        setSavedNotice(
          "Tersimpan secara lokal — jalankan SQL tabel v_hub_identities di Supabase agar tersimpan di DB."
        );
        pushActivity("Menyimpan ringkasan v-hub secara lokal.");
      }
      return;
    }

    setSavingIdentity(false);
    setSavedNotice("Ringkasan identitas v-hub tersimpan secara lokal.");
    pushActivity("Menyimpan ringkasan v-hub secara lokal.");
  }

  const followableEntities = useMemo<FollowEntity[]>(() => {
    const companyEntities: FollowEntity[] = allCompanies.map((c) => ({
      id: `company-${c.id}`,
      name: c.company_name,
      handle: `@${c.company_name.toLowerCase().replace(/[^a-z0-9]/g, "") || "company"}`,
      entityType: "company",
      subtitle: `${c.industry || "Company"} · ${c.location || "v-nect Business"}`,
      destinationHref: "/business-feed",
      destinationLabel: "Masuk ke Feed →",
    }));

    return [...companyEntities, ...DEFAULT_PERSONAL_PROFILES];
  }, [allCompanies]);

  const filteredFollowables = useMemo(() => {
    if (followFilter === "all") return followableEntities;
    return followableEntities.filter((item) => item.entityType === followFilter);
  }, [followableEntities, followFilter]);

  async function toggleFollowEntity(entity: FollowEntity) {
    const isFollowing = followedIds.includes(entity.id);
    const nextIds = isFollowing
      ? followedIds.filter((id) => id !== entity.id)
      : [...followedIds, entity.id];

    setFollowedIds(nextIds);
    try {
      window.localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(nextIds));
    } catch {
      // Ignore storage errors
    }

    if (isFollowing) {
      setSavedNotice(`Berhenti mengikuti ${entity.name}.`);
      pushActivity(`Unfollow ${entity.entityType === "company" ? "company" : "profil"} ${entity.name}.`);
      if (currentUserId) {
        await supabase
          .from("v_follows")
          .delete()
          .eq("user_id", currentUserId)
          .eq("target_key", entity.id);
      }
      return;
    }

    setSavedNotice(`Sekarang mengikuti ${entity.name}.`);
    pushActivity(`Follow ${entity.entityType === "company" ? "company" : "profil"} ${entity.name}.`);
    if (currentUserId) {
      await supabase.from("v_follows").upsert(
        {
          user_id: currentUserId,
          target_key: entity.id,
          target_name: entity.name,
          target_type: entity.entityType,
        },
        { onConflict: "user_id,target_key" }
      );
    }
  }

  return (
    <main className="hub-page">
      <header className="hub-navbar">
        <div className="hub-nav-left">
          <Link href="/" className="hub-brand">
            v<span>-nect</span>
            <small>V-HUB IDENTITY</small>
          </Link>

          <nav className="hub-nav-links">
            <Link href="/">Home</Link>
            <Link href="/business-feed">Business Feed</Link>
            <Link href="/v-circle">v-circle</Link>
            <Link href="/v-market">v-market</Link>
          </nav>
        </div>

        <div className="hub-nav-right">
          {currentUserName ? (
            <>
              <span className="hub-user-pill">● {currentUserName}</span>
              <button type="button" className="hub-ghost-btn" onClick={handleSignOut}>
                Keluar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="hub-ghost-btn"
              onClick={() => setAuthModalOpen(true)}
            >
              Masuk / Register
            </button>
          )}
        </div>
      </header>

      <section className="hub-container">
        <div className="hub-hero">
          <div>
            <span className="hub-eyebrow">MODULE 03 · IDENTITY &amp; WORKSPACE HUB</span>
            <h1>
              v-<span>hub.</span>
            </h1>
            <p>
              Build and manage your personal and company identity, follow profiles or companies, monitor activity, and jump straight into client workspaces.
            </p>
          </div>

          <div className="hub-hero-actions">
            <Link href="/company" className="hub-btn-primary">
              Manage Company →
            </Link>
            <Link href="/business-feed" className="hub-btn-secondary">
              Open Business Feed
            </Link>
          </div>
        </div>

        {savedNotice && (
          <div className="hub-banner">
            <span>✓ {savedNotice}</span>
            <button type="button" onClick={() => setSavedNotice("")}>
              ✕
            </button>
          </div>
        )}

        <div className="hub-grid">
          <div className="hub-card">
            <span className="hub-eyebrow">ACTIVE IDENTITY</span>
            <h2>Account &amp; Profile Status</h2>

            {currentUserId ? (
              <div className="hub-profile-box">
                <div className="hub-profile-row">
                  <div className="hub-avatar">
                    {(currentUserName || "V").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{currentUserName}</strong>
                    <small>{currentUserEmail || "Authenticated Member"}</small>
                  </div>
                </div>

                <div className="hub-meta-list">
                  <div>
                    <span>Active Mode</span>
                    <strong>
                      {activeProfileType === "company" ? "Company Profile" : "Personal Profile"}
                    </strong>
                  </div>
                  <div>
                    <span>Linked Company</span>
                    <strong>{activeCompany?.company_name || "Not selected yet"}</strong>
                  </div>
                  <div>
                    <span>Following</span>
                    <strong>{followedIds.length} profiles / companies</strong>
                  </div>
                  <div>
                    <span>Registered Companies</span>
                    <strong>{allCompanies.length} in database</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hub-guest-box">
                <p>
                  Masuk ke akun v-nect Anda untuk melihat status profil aktif, menyimpan data ke Supabase, dan mengikuti akun/perusahaan.
                </p>
                <button
                  type="button"
                  className="hub-btn-primary"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Masuk / Register Sekarang
                </button>
              </div>
            )}
          </div>

          <div className="hub-card">
            <span className="hub-eyebrow">IDENTITY POSITIONING</span>
            <h2>Hub Headline &amp; Focus</h2>

            <form className="hub-form" onSubmit={handleSaveIdentity}>
              <label>
                Headline
                <input
                  type="text"
                  value={identityNote.headline}
                  onChange={(e) =>
                    setIdentityNote((prev) => ({ ...prev, headline: e.target.value }))
                  }
                  maxLength={140}
                />
              </label>

              <label>
                Summary
                <textarea
                  rows={3}
                  value={identityNote.summary}
                  onChange={(e) =>
                    setIdentityNote((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  maxLength={400}
                />
              </label>

              <label>
                Core Focus Areas
                <input
                  type="text"
                  value={identityNote.focusAreas}
                  onChange={(e) =>
                    setIdentityNote((prev) => ({ ...prev, focusAreas: e.target.value }))
                  }
                  maxLength={180}
                />
              </label>

              <button type="submit" className="hub-btn-primary" disabled={savingIdentity}>
                {savingIdentity ? "Menyimpan..." : "Simpan Ringkasan Hub"}
              </button>
            </form>
          </div>
        </div>

        <section className="hub-section">
          <div className="hub-section-head">
            <div>
              <span className="hub-eyebrow">PERSONAL &amp; COMPANY FOLLOW DIRECTORY</span>
              <h2>Follow Profiles &amp; Connect to Workspaces</h2>
            </div>

            <div className="hub-filter-group">
              <button
                type="button"
                className={followFilter === "all" ? "hub-chip active" : "hub-chip"}
                onClick={() => setFollowFilter("all")}
              >
                All ({followableEntities.length})
              </button>
              <button
                type="button"
                className={followFilter === "company" ? "hub-chip active" : "hub-chip"}
                onClick={() => setFollowFilter("company")}
              >
                Company
              </button>
              <button
                type="button"
                className={followFilter === "personal" ? "hub-chip active" : "hub-chip"}
                onClick={() => setFollowFilter("personal")}
              >
                Personal
              </button>
            </div>
          </div>

          <div className="hub-follow-grid">
            {filteredFollowables.map((item) => {
              const isFollowing = followedIds.includes(item.id);
              return (
                <article className="hub-follow-card" key={item.id}>
                  <div className="hub-follow-top">
                    <span className="hub-type-pill">
                      {item.entityType === "company" ? "COMPANY" : "PERSONAL"}
                    </span>
                    <small>{item.handle}</small>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.subtitle}</p>
                  <div className="hub-follow-actions">
                    <button
                      type="button"
                      className={isFollowing ? "hub-btn-following" : "hub-btn-primary"}
                      onClick={() => toggleFollowEntity(item)}
                    >
                      {isFollowing ? "Following ✓" : "+ Follow"}
                    </button>
                    <Link href={item.destinationHref} className="hub-connect-link">
                      {item.destinationLabel}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="hub-section">
          <div className="hub-section-head">
            <div>
              <span className="hub-eyebrow">LIVE ACTIVITY &amp; FEED UPDATES</span>
              <h2>Recent Ecosystem Activity</h2>
            </div>
            <Link href="/business-feed" className="hub-connect-link">
              Lihat Semua Post di Feed →
            </Link>
          </div>

          <div className="hub-grid">
            <div className="hub-card">
              <span className="hub-eyebrow">PUBLISHED BUSINESS POSTS</span>
              <h2>Latest Feed Activity</h2>
              {recentPosts.length === 0 ? (
                <p className="hub-muted">Belum ada aktivitas post terbaru.</p>
              ) : (
                <ul className="hub-activity-list">
                  {recentPosts.map((post) => (
                    <li key={post.id}>
                      <strong>{post.title}</strong>
                      <small>
                        {post.companies?.company_name || "Company"} · {post.post_type}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="hub-card">
              <span className="hub-eyebrow">YOUR SESSION &amp; FOLLOW LOG</span>
              <h2>Recent Hub Actions</h2>
              <ul className="hub-activity-list">
                {activityLog.map((entry, idx) => (
                  <li key={`${entry}-${idx}`}>
                    <span>{entry}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="hub-section">
          <div className="hub-section-head">
            <div>
              <span className="hub-eyebrow">ECOSYSTEM SHORTCUTS</span>
              <h2>Connected Modules</h2>
            </div>
          </div>

          <div className="hub-shortcuts-grid">
            <Link href="/business-feed" className="hub-shortcut-card">
              <span>04 · FEED</span>
              <h3>v-business feed</h3>
              <p>Publish updates, multi-image posts, and video clips.</p>
            </Link>

            <Link href="/v-circle" className="hub-shortcut-card">
              <span>05 · NETWORK</span>
              <h3>v-circle</h3>
              <p>Grow professional connections and join curated circles.</p>
            </Link>

            <Link href="/v-market" className="hub-shortcut-card">
              <span>06 · COMMERCE</span>
              <h3>v-market</h3>
              <p>Explore products, services, and verified suppliers.</p>
            </Link>
          </div>
        </section>
      </section>

      <footer className="hub-footer">
        v-nect v-hub ·{" "}
        {currentUserId
          ? `Signed in as ${currentUserName}${dbSyncActive ? " (Supabase Sync Active)" : " (Local Sync)"}`
          : "Public Preview"}{" "}
        · © {new Date().getFullYear()} v-nect
      </footer>

      <AccountAuthModal
        open={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => syncHubData()}
      />

      <style jsx>{`
        .hub-page {
          min-height: 100vh;
          background: #07111f;
          color: #eef4fb;
          font-family: var(--font-sans), Arial, sans-serif;
        }

        .hub-navbar {
          min-height: 74px;
          padding: 12px 7%;
          background: #07111f;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .hub-nav-left,
        .hub-nav-right {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .hub-brand {
          color: #ffffff;
          text-decoration: none;
          font-size: 21px;
          font-weight: 800;
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
        }

        .hub-brand span,
        .hub-hero h1 span {
          color: #13c8b5;
        }

        .hub-brand small {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
          color: #9cb0c9;
        }

        .hub-nav-links {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .hub-nav-links a {
          color: #d2deed;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .hub-nav-links a:hover {
          color: #13c8b5;
        }

        .hub-user-pill {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(19, 200, 181, 0.16);
          border: 1px solid rgba(19, 200, 181, 0.45);
          color: #7ee8dc;
          font-size: 12px;
          font-weight: 700;
        }

        .hub-ghost-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #eef4fb;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .hub-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 72px;
        }

        .hub-hero {
          background: linear-gradient(125deg, #102b4d, #134a66);
          border: 1px solid rgba(126, 232, 220, 0.2);
          border-radius: 18px;
          padding: 34px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hub-eyebrow {
          display: inline-block;
          color: #13c8b5;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .hub-hero h1 {
          margin: 8px 0;
          font-size: 42px;
          font-weight: 800;
        }

        .hub-hero p {
          margin: 0;
          color: #d2e2f3;
          font-size: 15px;
          line-height: 1.65;
          max-width: 580px;
        }

        .hub-hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hub-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          padding: 9px 15px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .hub-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          padding: 10px 16px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .hub-btn-following {
          border: 1px solid rgba(19, 200, 181, 0.45);
          background: rgba(19, 200, 181, 0.16);
          color: #7ee8dc;
          padding: 9px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .hub-banner {
          margin-top: 18px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(19, 200, 181, 0.14);
          border: 1px solid rgba(19, 200, 181, 0.4);
          color: #9ff5eb;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hub-banner button {
          border: none;
          background: transparent;
          color: #9ff5eb;
          cursor: pointer;
        }

        .hub-grid {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .hub-card,
        .hub-shortcut-card,
        .hub-follow-card {
          background: #0d1e34;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          padding: 22px;
        }

        .hub-card h2 {
          margin: 6px 0 16px;
          font-size: 20px;
          font-weight: 700;
        }

        .hub-profile-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .hub-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1b3f6b, #145b79);
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 800;
        }

        .hub-profile-row strong {
          display: block;
          font-size: 15px;
        }

        .hub-profile-row small {
          display: block;
          font-size: 12px;
          color: #9cb2cc;
        }

        .hub-meta-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hub-meta-list > div {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.04);
          font-size: 13px;
        }

        .hub-meta-list span {
          color: #9cb2cc;
        }

        .hub-guest-box p,
        .hub-muted {
          margin: 0 0 14px;
          color: #b7c8dd;
          font-size: 14px;
          line-height: 1.65;
        }

        .hub-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hub-form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #c5d5e8;
        }

        .hub-form input,
        .hub-form textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: #081526;
          color: #ffffff;
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .hub-section {
          margin-top: 34px;
        }

        .hub-section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .hub-section-head h2 {
          margin: 4px 0 0;
          font-size: 24px;
          font-weight: 800;
        }

        .hub-filter-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .hub-chip {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: #0d1e34;
          color: #c8d7ea;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .hub-chip.active {
          background: rgba(19, 200, 181, 0.2);
          border-color: #13c8b5;
          color: #7ee8dc;
        }

        .hub-follow-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .hub-follow-top,
        .hub-follow-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hub-type-pill {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(52, 124, 240, 0.2);
          color: #8cc0ff;
        }

        .hub-follow-top small {
          color: #9cb2cc;
          font-size: 12px;
        }

        .hub-follow-card h3 {
          margin: 8px 0 4px;
          font-size: 17px;
        }

        .hub-follow-card p {
          margin: 0 0 12px;
          font-size: 12px;
          color: #b4c5da;
          line-height: 1.55;
        }

        .hub-connect-link {
          color: #7ee8dc;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .hub-activity-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hub-activity-list li {
          padding: 10px 12px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.04);
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hub-activity-list small {
          color: #9cb2cc;
          font-size: 11px;
        }

        .hub-shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .hub-shortcut-card {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hub-shortcut-card:hover {
          border-color: #13c8b5;
        }

        .hub-shortcut-card span {
          font-size: 11px;
          font-weight: 800;
          color: #13c8b5;
          letter-spacing: 1.2px;
        }

        .hub-shortcut-card h3 {
          margin: 0;
          font-size: 18px;
        }

        .hub-shortcut-card p {
          margin: 0;
          font-size: 13px;
          color: #b4c5da;
          line-height: 1.6;
        }

        .hub-footer {
          text-align: center;
          padding: 26px 20px;
          background: #050d18;
          color: #8fa4bf;
          font-size: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        @media (max-width: 900px) {
          .hub-follow-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 820px) {
          .hub-grid,
          .hub-shortcuts-grid,
          .hub-follow-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
