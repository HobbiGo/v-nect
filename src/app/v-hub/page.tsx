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

type WorkspaceCardItem = {
  id: string;
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  scrollTargetId?: string;
  accent: string;
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
    destinationLabel: "Connect in Circle ->",
  },
  {
    id: "personal-james",
    name: "James Carter",
    handle: "@jamescarter",
    entityType: "personal",
    subtitle: "Head of Strategic Partnerships · Personal Profile",
    destinationHref: "/v-circle",
    destinationLabel: "Connect in Circle ->",
  },
  {
    id: "personal-noah",
    name: "Noah Smith",
    handle: "@noahsmith",
    entityType: "personal",
    subtitle: "Full-Stack Platform Engineer · Personal Profile",
    destinationHref: "/v-circle",
    destinationLabel: "Connect in Circle ->",
  },
];

const WORKSPACE_CARDS: WorkspaceCardItem[] = [
  {
    id: "ws-companies",
    badge: "05 · NETWORK",
    title: "Explore Companies",
    description:
      "Discover active businesses, compare industries, and reach out to partner companies in v-circle.",
    ctaLabel: "Check now",
    href: "/v-circle",
    accent: "linear-gradient(135deg, #273c8a, #4b6bff)",
  },
  {
    id: "ws-partners",
    badge: "05 · CONNECTIONS",
    title: "Find Partners & Leads",
    description:
      "Connect with founders, decision-makers, and regional collaborators across the v-nect network.",
    ctaLabel: "Find now",
    href: "/v-circle",
    accent: "linear-gradient(135deg, #2d2a7a, #6948ff)",
  },
  {
    id: "ws-dataroom",
    badge: "03 · WORKSPACE",
    title: "My Hub & Positioning",
    description:
      "Manage your hub headline, positioning summary, core focus areas, and recent session activity.",
    ctaLabel: "Get In",
    scrollTargetId: "hub-positioning-section",
    accent: "linear-gradient(135deg, #1f357a, #3b5bdb)",
  },
  {
    id: "ws-market",
    badge: "06 · COMMERCE",
    title: "Market & Suppliers",
    description:
      "Browse products, services, and verified suppliers, inspect photos, comment, and request info.",
    ctaLabel: "Open Market",
    href: "/v-market",
    accent: "linear-gradient(135deg, #2a2875, #7854ff)",
  },
  {
    id: "ws-launch",
    badge: "04 · BUSINESS FEED",
    title: "Publish Updates & Launches",
    description:
      "Share product launches, promo updates, and company news directly to the business feed.",
    ctaLabel: "Create Post",
    href: "/business-feed",
    accent: "linear-gradient(135deg, #1d3680, #4b6bff)",
  },
  {
    id: "ws-company",
    badge: "COMPANY PROFILE",
    title: "Manage Company Profile",
    description:
      "Configure company identity, linked workspace mode, and active business details.",
    ctaLabel: "Manage Now",
    href: "/company",
    accent: "linear-gradient(135deg, #252b6e, #5c4dff)",
  },
  {
    id: "ws-activity",
    badge: "LIVE TIMELINE",
    title: "Business & Feed Activity",
    description:
      "Track published business posts, follow updates, and recent actions in one timeline.",
    ctaLabel: "View Activity",
    scrollTargetId: "hub-activity-section",
    accent: "linear-gradient(135deg, #1c2f73, #4263eb)",
  },
  {
    id: "ws-outreach",
    badge: "FOLLOW & CONNECT",
    title: "Client & Profile Outreach",
    description:
      "Follow personal profiles or companies and jump straight into their connected workspace.",
    ctaLabel: "Start Outreach",
    scrollTargetId: "hub-follow-section",
    accent: "linear-gradient(135deg, #2b277a, #7048e8)",
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

  const [platformSearch, setPlatformSearch] = useState("");
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

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
          `Tersimpan lokal (${error.message}). Cek tabel/policy v_hub_identities di Supabase.`
        );
        pushActivity("Menyimpan ringkasan v-hub secara lokal.");
      }
      return;
    }

    setSavingIdentity(false);
    setSavedNotice("Ringkasan identitas v-hub tersimpan secara lokal.");
    pushActivity("Menyimpan ringkasan v-hub secara lokal.");
  }

  const profileCompletion = useMemo(() => {
    let score = 20;
    if (currentUserId) score += 20;
    if (identityNote.headline.trim().length > 3) score += 20;
    if (identityNote.summary.trim().length > 10) score += 20;
    if (identityNote.focusAreas.trim().length > 3) score += 10;
    if (activeCompany) score += 10;
    return Math.min(100, score);
  }, [currentUserId, identityNote, activeCompany]);

  const followableEntities = useMemo<FollowEntity[]>(() => {
    const companyEntities: FollowEntity[] = allCompanies.map((c) => ({
      id: `company-${c.id}`,
      name: c.company_name,
      handle: `@${c.company_name.toLowerCase().replace(/[^a-z0-9]/g, "") || "company"}`,
      entityType: "company",
      subtitle: `${c.industry || "Company"} · ${c.location || "v-nect Business"}`,
      destinationHref: "/business-feed",
      destinationLabel: "Masuk ke Feed ->",
    }));

    return [...companyEntities, ...DEFAULT_PERSONAL_PROFILES];
  }, [allCompanies]);

  const filteredFollowables = useMemo(() => {
    const q = platformSearch.trim().toLowerCase();
    return followableEntities.filter((item) => {
      if (followFilter !== "all" && item.entityType !== followFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.handle.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
      );
    });
  }, [followableEntities, followFilter, platformSearch]);

  const filteredWorkspaceCards = useMemo(() => {
    const q = platformSearch.trim().toLowerCase();
    if (!q) return WORKSPACE_CARDS;
    return WORKSPACE_CARDS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.badge.toLowerCase().includes(q)
    );
  }, [platformSearch]);

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
      pushActivity(
        `Unfollow ${entity.entityType === "company" ? "company" : "profil"} ${entity.name}.`
      );
      if (currentUserId) {
        const { error } = await supabase
          .from("v_follows")
          .delete()
          .eq("user_id", currentUserId)
          .eq("target_key", entity.id);
        if (error) {
          setSavedNotice(`Unfollow lokal (${error.message}).`);
        }
      }
      return;
    }

    setSavedNotice(`Sekarang mengikuti ${entity.name}.`);
    pushActivity(
      `Follow ${entity.entityType === "company" ? "company" : "profil"} ${entity.name}.`
    );
    if (currentUserId) {
      const { error } = await supabase.from("v_follows").upsert(
        {
          user_id: currentUserId,
          target_key: entity.id,
          target_name: entity.name,
          target_type: entity.entityType,
        },
        { onConflict: "user_id,target_key" }
      );
      if (error) {
        setSavedNotice(`Follow lokal (${error.message}).`);
      }
    }
  }

  return (
    <main className="hub-page">
      <header className="hub-navbar">
        <div className="hub-nav-left">
          <Link href="/" className="hub-brand">
            v<span>-nect</span>
            <small>V-HUB WORKSPACE</small>
          </Link>

          <nav className="hub-nav-links">
            <Link href="/">Home</Link>
            <Link href="/business-feed">Business Feed</Link>
            <Link href="/v-circle">v-circle</Link>
            <Link href="/v-market">v-market</Link>
          </nav>
        </div>

        <div className="hub-nav-right">
          <input
            type="search"
            value={platformSearch}
            onChange={(e) => setPlatformSearch(e.target.value)}
            placeholder="Platform Search (workspace, company, profile)..."
            className="hub-search-box"
          />

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
        <div className="hub-welcome-bar">
          <div>
            <span className="hub-eyebrow">MODULE 03 · CENTRAL WORKSPACE DASHBOARD</span>
            <h1>
              Hello {currentUserName || "Zefyron"}, <span>v-hub.</span>
            </h1>
            <p>
              Complete your profile to connect better with your network and jump straight into key client &amp; business modules.
            </p>
          </div>

          <div className="hub-completion-box">
            <div className="hub-completion-top">
              <span>Profile</span>
              <strong>{profileCompletion}%</strong>
              <small>completed</small>
            </div>
            <div className="hub-progress-track">
              <div
                className="hub-progress-fill"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
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

        <section className="hub-section">
          <div className="hub-section-head">
            <div>
              <span className="hub-eyebrow">QUICK WORKSPACE ACTIONS</span>
              <h2>Connect to Key Modules &amp; Client Spaces</h2>
            </div>
          </div>

          <div className="hub-ws-grid">
            {filteredWorkspaceCards.map((card) => (
              <article className="hub-ws-card" key={card.id}>
                <div
                  className="hub-ws-thumb"
                  style={{ background: card.accent }}
                >
                  <span className="hub-ws-badge">{card.badge}</span>
                </div>
                <div className="hub-ws-body">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <div className="hub-ws-foot">
                    {card.href ? (
                      <Link href={card.href} className="hub-btn-primary">
                        {card.ctaLabel}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="hub-btn-primary"
                        onClick={() =>
                          card.scrollTargetId && scrollToSection(card.scrollTargetId)
                        }
                      >
                        {card.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div id="hub-positioning-section" className="hub-grid">
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

        <section id="hub-follow-section" className="hub-section">
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

        <section id="hub-activity-section" className="hub-section">
          <div className="hub-section-head">
            <div>
              <span className="hub-eyebrow">LIVE ACTIVITY &amp; FEED UPDATES</span>
              <h2>Recent Ecosystem Activity</h2>
            </div>
            <Link href="/business-feed" className="hub-connect-link">
              Lihat Semua Post di Feed -&gt;
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
          color: #f3f7ff;
          font-family: var(--font-sans), Arial, sans-serif;
          background:
            radial-gradient(
              circle at 78% 14%,
              rgba(78, 108, 255, 0.32),
              transparent 36%
            ),
            radial-gradient(
              circle at 22% 32%,
              rgba(120, 84, 255, 0.22),
              transparent 42%
            ),
            linear-gradient(180deg, #060b24 0%, #091338 55%, #060b24 100%);
        }

        .hub-navbar {
          min-height: 74px;
          padding: 12px 6%;
          background: rgba(6, 11, 36, 0.88);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(138, 165, 255, 0.14);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .hub-nav-left,
        .hub-nav-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .hub-brand {
          color: #ffffff;
          text-decoration: none;
          font-size: 21px;
          font-weight: 850;
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
        }

        .hub-brand span,
        .hub-welcome-bar h1 span {
          color: #8ab4ff;
        }

        .hub-brand small {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
          color: #96a8d0;
        }

        .hub-nav-links {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .hub-nav-links a {
          color: #c8d7f5;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }

        .hub-nav-links a:hover {
          color: #ffffff;
        }

        .hub-search-box {
          width: 240px;
          max-width: 100%;
          padding: 7px 12px;
          border-radius: 9px;
          border: 1px solid rgba(138, 165, 255, 0.24);
          background: #081029;
          color: #f3f7ff;
          font-size: 12px;
          outline: none;
        }

        .hub-search-box::placeholder {
          color: #889bc2;
        }

        .hub-search-box:focus {
          border-color: #7854ff;
        }

        .hub-user-pill {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(92, 124, 255, 0.18);
          border: 1px solid rgba(138, 180, 255, 0.38);
          color: #c7dcff;
          font-size: 12px;
          font-weight: 700;
        }

        .hub-ghost-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(138, 165, 255, 0.28);
          color: #eef3ff;
          padding: 7px 13px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .hub-container {
          max-width: 1220px;
          margin: 0 auto;
          padding: 28px 24px 72px;
        }

        .hub-welcome-bar {
          background: linear-gradient(
            125deg,
            rgba(22, 36, 82, 0.94),
            rgba(13, 24, 62, 0.98)
          );
          border: 1px solid rgba(138, 165, 255, 0.24);
          border-radius: 18px;
          padding: 28px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          box-shadow: 0 14px 32px rgba(3, 8, 24, 0.36);
        }

        .hub-eyebrow {
          display: inline-block;
          color: #79a6ff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .hub-welcome-bar h1 {
          margin: 6px 0;
          font-size: 36px;
          font-weight: 850;
          color: #ffffff;
        }

        .hub-welcome-bar p {
          margin: 0;
          color: #b8c7e6;
          font-size: 14px;
          line-height: 1.6;
          max-width: 620px;
        }

        .hub-completion-box {
          min-width: 190px;
          background: rgba(8, 16, 41, 0.75);
          border: 1px solid rgba(138, 165, 255, 0.24);
          border-radius: 12px;
          padding: 14px 16px;
        }

        .hub-completion-top {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-bottom: 8px;
        }

        .hub-completion-top span {
          font-size: 12px;
          color: #b8c7e6;
        }

        .hub-completion-top strong {
          font-size: 24px;
          color: #8ab4ff;
        }

        .hub-completion-top small {
          font-size: 11px;
          color: #9cb0d9;
        }

        .hub-progress-track {
          height: 7px;
          border-radius: 999px;
          background: rgba(138, 165, 255, 0.16);
          overflow: hidden;
        }

        .hub-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4b6bff, #7854ff);
          border-radius: 999px;
        }

        .hub-banner {
          margin-top: 18px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(92, 124, 255, 0.18);
          border: 1px solid rgba(138, 180, 255, 0.42);
          color: #dce7ff;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .hub-banner button {
          border: none;
          background: transparent;
          color: #dce7ff;
          cursor: pointer;
        }

        .hub-ws-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .hub-ws-card {
          background: linear-gradient(
            160deg,
            rgba(20, 32, 72, 0.92),
            rgba(11, 19, 46, 0.96)
          );
          border: 1px solid rgba(138, 165, 255, 0.18);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 24px rgba(3, 8, 24, 0.25);
        }

        .hub-ws-thumb {
          height: 92px;
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .hub-ws-badge {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 4px 9px;
          border-radius: 999px;
          background: rgba(6, 11, 36, 0.72);
          border: 1px solid rgba(138, 180, 255, 0.25);
          color: #e6f0ff;
        }

        .hub-ws-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .hub-ws-body h3 {
          margin: 0 0 6px;
          font-size: 16px;
          font-weight: 750;
          color: #ffffff;
        }

        .hub-ws-body p {
          margin: 0 0 14px;
          font-size: 12px;
          color: #b8c7e6;
          line-height: 1.55;
        }

        .hub-ws-foot {
          margin-top: auto;
        }

        .hub-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .hub-btn-following {
          border: 1px solid rgba(138, 180, 255, 0.5);
          background: rgba(92, 124, 255, 0.24);
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .hub-grid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .hub-card,
        .hub-follow-card {
          background: linear-gradient(
            160deg,
            rgba(20, 32, 72, 0.92),
            rgba(11, 19, 46, 0.96)
          );
          border: 1px solid rgba(138, 165, 255, 0.18);
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 10px 24px rgba(3, 8, 24, 0.25);
        }

        .hub-card h2 {
          margin: 6px 0 16px;
          font-size: 20px;
          font-weight: 750;
          color: #ffffff;
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
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 800;
        }

        .hub-profile-row strong {
          display: block;
          font-size: 15px;
          color: #ffffff;
        }

        .hub-profile-row small {
          display: block;
          font-size: 12px;
          color: #9cb0d9;
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
          background: rgba(8, 16, 41, 0.72);
          border: 1px solid rgba(138, 165, 255, 0.14);
          font-size: 13px;
        }

        .hub-meta-list span {
          color: #9cb0d9;
        }

        .hub-guest-box p,
        .hub-muted {
          margin: 0 0 14px;
          color: #b8c7e6;
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
          color: #c8d7f5;
        }

        .hub-form input,
        .hub-form textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border-radius: 9px;
          border: 1px solid rgba(138, 165, 255, 0.24);
          background: #081029;
          color: #f3f7ff;
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .hub-form input:focus,
        .hub-form textarea:focus {
          border-color: #7854ff;
        }

        .hub-section {
          margin-top: 32px;
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
          font-size: 23px;
          font-weight: 800;
          color: #ffffff;
        }

        .hub-filter-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .hub-chip {
          border: 1px solid rgba(138, 165, 255, 0.22);
          background: rgba(14, 24, 58, 0.85);
          color: #c8d7f5;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .hub-chip.active {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          border-color: transparent;
          color: #ffffff;
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
          background: rgba(92, 124, 255, 0.2);
          border: 1px solid rgba(138, 180, 255, 0.28);
          color: #9ec0ff;
        }

        .hub-follow-top small {
          color: #9cb0d9;
          font-size: 12px;
        }

        .hub-follow-card h3 {
          margin: 8px 0 4px;
          font-size: 17px;
          color: #ffffff;
        }

        .hub-follow-card p {
          margin: 0 0 12px;
          font-size: 12px;
          color: #b8c7e6;
          line-height: 1.55;
        }

        .hub-connect-link {
          color: #8ab4ff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .hub-connect-link:hover {
          text-decoration: underline;
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
          background: rgba(8, 16, 41, 0.72);
          border: 1px solid rgba(138, 165, 255, 0.14);
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hub-activity-list small {
          color: #9cb0d9;
          font-size: 11px;
        }

        .hub-footer {
          text-align: center;
          padding: 28px 20px;
          background: #050a20;
          color: #96a8d0;
          font-size: 12px;
          border-top: 1px solid rgba(138, 165, 255, 0.14);
        }

        @media (max-width: 1060px) {
          .hub-ws-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .hub-follow-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 820px) {
          .hub-grid,
          .hub-ws-grid,
          .hub-follow-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
