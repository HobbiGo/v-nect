"use client";
// V-HUB TIKTOK SAFE - file kecil, baris pendek, pasti ke-build
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
  companies: { company_name: string } | null;
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
};
const HUB_NOTE_KEY = "v-nect_v_hub_identity_v1";
const FOLLOWS_KEY = "v-nect_v_hub_follows_v1";
const DEFAULT_PERSONAL: FollowEntity[] = [
  {
    id: "personal-sophia",
    name: "Sophia Lee",
    handle: "@sophialee",
    entityType: "personal",
    subtitle: "Co-Founder & Product Lead",
    destinationHref: "/v-circle",
    destinationLabel: "Connect in Circle ->",
  },
  {
    id: "personal-james",
    name: "James Carter",
    handle: "@jamescarter",
    entityType: "personal",
    subtitle: "Head of Strategic Partnerships",
    destinationHref: "/v-circle",
    destinationLabel: "Connect in Circle ->",
  },
  {
    id: "personal-noah",
    name: "Noah Smith",
    handle: "@noahsmith",
    entityType: "personal",
    subtitle: "Full-Stack Platform Engineer",
    destinationHref: "/v-circle",
    destinationLabel: "Connect in Circle ->",
  },
];
const WORKSPACE_CARDS: WorkspaceCardItem[] = [
  { id: "ws-companies", badge: "NETWORK", title: "Explore Companies", description: "Discover active businesses and partner companies.", ctaLabel: "Check now", href: "/v-circle" },
  { id: "ws-partners", badge: "CONNECTIONS", title: "Find Partners & Leads", description: "Connect with founders and regional collaborators.", ctaLabel: "Find now", href: "/v-circle" },
  { id: "ws-dataroom", badge: "WORKSPACE", title: "My Hub & Positioning", description: "Manage headline, summary, and focus areas.", ctaLabel: "Get In", scrollTargetId: "hub-positioning-section" },
  { id: "ws-market", badge: "COMMERCE", title: "Market & Suppliers", description: "Browse products and verified suppliers.", ctaLabel: "Open Market", href: "/v-market" },
  { id: "ws-launch", badge: "BUSINESS FEED", title: "Publish Updates & Launches", description: "Share launches and company news to the feed.", ctaLabel: "Create Post", href: "/business-feed" },
  { id: "ws-company", badge: "COMPANY", title: "Manage Company Profile", description: "Configure company identity and workspace mode.", ctaLabel: "Manage Now", href: "/company" },
  { id: "ws-activity", badge: "TIMELINE", title: "Business & Feed Activity", description: "Track posts and recent actions in one timeline.", ctaLabel: "View Activity", scrollTargetId: "hub-activity-section" },
  { id: "ws-outreach", badge: "OUTREACH", title: "Client & Profile Outreach", description: "Follow profiles or companies.", ctaLabel: "Start Outreach", scrollTargetId: "hub-follow-section" },
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
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([
    "Membuka dashboard v-hub.",
  ]);
  const [identityNote, setIdentityNote] = useState<HubIdentityNote>({
    headline: "Global Business & Collaboration Hub",
    summary: "Unified identity space connecting personal credentials, company profiles, live feeds, and partner networks.",
    focusAreas: "B2B Partnerships, Video Commerce, Regional Expansion",
  });
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    try {
      const rawNote = window.localStorage.getItem(HUB_NOTE_KEY);
      if (rawNote) {
        const parsed = JSON.parse(rawNote);
        if (parsed && typeof parsed === "object") {
          setIdentityNote((prev) => ({
            headline: typeof parsed.headline === "string" ? parsed.headline : prev.headline,
            summary: typeof parsed.summary === "string" ? parsed.summary : prev.summary,
            focusAreas: typeof parsed.focusAreas === "string" ? parsed.focusAreas : prev.focusAreas,
          }));
        }
      }
      const rawFollows = window.localStorage.getItem(FOLLOWS_KEY);
      if (rawFollows) {
        const parsedFollows = JSON.parse(rawFollows);
        if (Array.isArray(parsedFollows)) {
          setFollowedIds(parsedFollows.filter((x): x is string => typeof x === "string"));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  function pushActivity(text: string) {
    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setActivityLog((prev) => ["[" + timeStr + "] " + text, ...prev.slice(0, 7)]);
  }

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadUserIdentityFromDb(uid: string) {
    const res = await supabase.from("v_hub_identities").select("headline, summary, focus_areas").eq("user_id", uid).maybeSingle();
    if (!res.error) {
      setDbSyncActive(true);
      if (res.data) {
        setIdentityNote({
          headline: res.data.headline || "Global Business & Collaboration Hub",
          summary: res.data.summary || "Unified identity space.",
          focusAreas: res.data.focus_areas || "B2B Partnerships, Video Commerce, Regional Expansion",
        });
      }
    }
  }

  async function loadUserFollowsFromDb(uid: string) {
    const res = await supabase.from("v_follows").select("target_key").eq("user_id", uid);
    if (!res.error && Array.isArray(res.data)) {
      setDbSyncActive(true);
      if (res.data.length > 0) setFollowedIds(res.data.map((r) => r.target_key));
    }
  }

  async function syncHubData() {
    const userRes = await supabase.auth.getUser();
    const user = userRes.data.user;
    const compRes = await supabase.from("companies").select("id, company_name, logo_url, industry, description, location").order("created_at", { ascending: false }).limit(12);
    if (Array.isArray(compRes.data)) setAllCompanies(compRes.data as HubCompany[]);
    const postRes = await supabase.from("business_posts").select("id, title, post_type, created_at, companies ( company_name )").eq("status", "published").order("created_at", { ascending: false }).limit(5);
    if (Array.isArray(postRes.data)) setRecentPosts(postRes.data as unknown as RecentPostActivity[]);
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
    const fallbackName = (user.user_metadata?.full_name as string | undefined)?.trim() || user.email?.split("@")[0] || "Member";
    setCurrentUserName(fallbackName);
    const settingsRes = await supabase.from("account_settings").select("active_profile_type, active_company_id").eq("user_id", user.id).maybeSingle();
    const settings = settingsRes.data;
    const profileType = (settings && settings.active_profile_type) || "personal";
    setActiveProfileType(profileType);
    if (settings && settings.active_company_id) {
      const compOne = await supabase.from("companies").select("id, company_name, logo_url, industry, description, location").eq("id", settings.active_company_id).maybeSingle();
      if (compOne.data) {
        setActiveCompany(compOne.data as HubCompany);
        if (profileType === "company") setCurrentUserName(compOne.data.company_name);
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
    const sub = supabase.auth.onAuthStateChange(() => {
      if (active) syncHubData();
    });
    return () => {
      active = false;
      sub.data.subscription.unsubscribe();
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
      window.localStorage.setItem(HUB_NOTE_KEY, JSON.stringify(identityNote));
    } catch {
      // ignore
    }
    if (currentUserId) {
      const res = await supabase.from("v_hub_identities").upsert(
        { user_id: currentUserId, headline: identityNote.headline.trim(), summary: identityNote.summary.trim(), focus_areas: identityNote.focusAreas.trim(), updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      setSavingIdentity(false);
      if (!res.error) {
        setDbSyncActive(true);
        setSavedNotice("Ringkasan identitas v-hub tersimpan ke Supabase.");
        pushActivity("Memperbarui headline v-hub.");
      } else {
        setSavedNotice("Tersimpan lokal (" + res.error.message + ").");
        pushActivity("Menyimpan ringkasan v-hub secara lokal.");
      }
      setShowEditSheet(false);
      return;
    }
    setSavingIdentity(false);
    setSavedNotice("Ringkasan identitas v-hub tersimpan secara lokal.");
    pushActivity("Menyimpan ringkasan v-hub secara lokal.");
    setShowEditSheet(false);
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
      id: "company-" + c.id,
      name: c.company_name,
      handle: "@" + (c.company_name.toLowerCase().replace(/[^a-z0-9]/g, "") || "company"),
      entityType: "company",
      subtitle: (c.industry || "Company") + " - " + (c.location || "v-nect Business"),
      destinationHref: "/business-feed",
      destinationLabel: "Masuk ke Feed ->",
    }));
    return [...companyEntities, ...DEFAULT_PERSONAL];
  }, [allCompanies]);

  const filteredFollowables = useMemo(() => {
    const q = platformSearch.trim().toLowerCase();
    return followableEntities.filter((item) => {
      if (followFilter !== "all" && item.entityType !== followFilter) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.handle.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
    });
  }, [followableEntities, followFilter, platformSearch]);

  const filteredWorkspaceCards = useMemo(() => {
    const q = platformSearch.trim().toLowerCase();
    if (!q) return WORKSPACE_CARDS;
    return WORKSPACE_CARDS.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.badge.toLowerCase().includes(q));
  }, [platformSearch]);

  async function toggleFollowEntity(entity: FollowEntity) {
    const isFollowing = followedIds.includes(entity.id);
    const nextIds = isFollowing ? followedIds.filter((id) => id !== entity.id) : [...followedIds, entity.id];
    setFollowedIds(nextIds);
    try {
      window.localStorage.setItem(FOLLOWS_KEY, JSON.stringify(nextIds));
    } catch {
      // ignore
    }
    if (isFollowing) {
      setSavedNotice("Berhenti mengikuti " + entity.name + ".");
      pushActivity("Unfollow " + entity.name + ".");
      if (currentUserId) {
        const res = await supabase.from("v_follows").delete().eq("user_id", currentUserId).eq("target_key", entity.id);
        if (res.error) setSavedNotice("Unfollow lokal (" + res.error.message + ").");
      }
      return;
    }
    setSavedNotice("Sekarang mengikuti " + entity.name + ".");
    pushActivity("Follow " + entity.name + ".");
    if (currentUserId) {
      const res = await supabase.from("v_follows").upsert(
        { user_id: currentUserId, target_key: entity.id, target_name: entity.name, target_type: entity.entityType },
        { onConflict: "user_id,target_key" }
      );
      if (res.error) setSavedNotice("Follow lokal (" + res.error.message + ").");
    }
  }

  const displayName = currentUserName || "Zefyron";
  const firstLetter = displayName.charAt(0).toUpperCase();
  const companyName = activeCompany ? activeCompany.company_name : "Not selected yet";
  const profileLabel = activeProfileType === "company" ? "Company Profile" : "Personal Profile";

  return (
    <main className="tk-page">
      <header className="tk-top">
        <div className="tk-brand">
          v<span>-nect</span>
          <small>V-HUB</small>
        </div>
        <div className="tk-top-tabs">
          <button className="on" type="button">For You</button>
          <button type="button" onClick={() => scrollToSection("hub-follow-section")}>Following</button>
          <button type="button" onClick={() => scrollToSection("hub-activity-section")}>Trending</button>
        </div>
        {currentUserName ? (
          <div className="tk-user">
            <span>{currentUserName}</span>
            <button type="button" onClick={handleSignOut}>Keluar</button>
          </div>
        ) : (
          <button className="tk-login" type="button" onClick={() => setAuthModalOpen(true)}>Masuk / Register</button>
        )}
      </header>

      <div className="tk-searchbar">
        <input
          value={platformSearch}
          onChange={(e) => setPlatformSearch(e.target.value)}
          placeholder="Search workspace, company, profile..."
        />
      </div>

      {savedNotice ? (
        <div className="tk-toast">
          <span>{savedNotice}</span>
          <button type="button" onClick={() => setSavedNotice("")}>X</button>
        </div>
      ) : null}

      <section className="tk-profile">
        <div className="tk-cover">
          <span>v-nect original sound - v-hub</span>
        </div>
        <div className="tk-ava-big">{firstLetter}</div>
        <h1>Hello {displayName}, v-hub.</h1>
        <p>@{displayName.toLowerCase().replace(/[^a-z0-9]/g, "")} - {profileLabel}</p>
        <p className="tk-headline">{identityNote.headline}</p>
        <p className="tk-summary">{identityNote.summary}</p>
        <p className="tk-focus">Focus: {identityNote.focusAreas}</p>
        <div className="tk-stats">
          <div><b>{followedIds.length}</b><i>Following</i></div>
          <div><b>{allCompanies.length}</b><i>Companies</i></div>
          <div><b>{profileCompletion}%</b><i>Profile</i></div>
        </div>
        <div className="tk-actions">
          <button className="tk-primary" type="button" onClick={() => setShowEditSheet(true)}>Edit Profile</button>
          <button className="tk-ghost" type="button" onClick={() => setShowEditSheet(true)}>Share Profile</button>
        </div>
        <div className="tk-progress">
          <div style={{ width: profileCompletion + "%" }} />
        </div>
        <p className="tk-meta">Linked: {companyName} - Email: {currentUserEmail || "Guest"}</p>
      </section>

      <section className="tk-section">
        <h2>Connect to Key Modules</h2>
        <div className="tk-feed">
          {filteredWorkspaceCards.map((card) => (
            <article className="tk-card" key={card.id}>
              <span className="tk-badge">{card.badge}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              {card.href ? (
                <Link className="tk-primary" href={card.href}>{card.ctaLabel}</Link>
              ) : (
                <button
                  className="tk-primary"
                  type="button"
                  onClick={() => { if (card.scrollTargetId) scrollToSection(card.scrollTargetId); }}
                >
                  {card.ctaLabel}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section id="hub-positioning-section" className="tk-section">
        <h2>Account and Profile Status</h2>
        <div className="tk-card2">
          <p><b>{displayName}</b></p>
          <p>{currentUserEmail || "Authenticated Member"}</p>
          <p>Active Mode: {profileLabel}</p>
          <p>Linked Company: {companyName}</p>
          <p>Following: {followedIds.length} profiles / companies</p>
          <p>Registered Companies: {allCompanies.length} in database</p>
          <button className="tk-primary" type="button" onClick={() => setShowEditSheet(true)}>Edit Headline and Focus</button>
        </div>
      </section>

      <section id="hub-follow-section" className="tk-section">
        <h2>Follow Profiles and Workspaces</h2>
        <div className="tk-chips">
          <button className={followFilter === "all" ? "on" : ""} type="button" onClick={() => setFollowFilter("all")}>All</button>
          <button className={followFilter === "company" ? "on" : ""} type="button" onClick={() => setFollowFilter("company")}>Company</button>
          <button className={followFilter === "personal" ? "on" : ""} type="button" onClick={() => setFollowFilter("personal")}>Personal</button>
        </div>
        <div className="tk-follow-grid">
          {filteredFollowables.map((item) => {
            const isFollowing = followedIds.includes(item.id);
            return (
              <article className="tk-follow" key={item.id}>
                <span className="tk-badge">{item.entityType === "company" ? "COMPANY" : "PERSONAL"}</span>
                <p>{item.handle}</p>
                <h3>{item.name}</h3>
                <p>{item.subtitle}</p>
                <button
                  className={isFollowing ? "tk-joined" : "tk-primary"}
                  type="button"
                  onClick={() => toggleFollowEntity(item)}
                >
                  {isFollowing ? "Following" : "+ Follow"}
                </button>
                <Link className="tk-ghost" href={item.destinationHref}>{item.destinationLabel}</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section id="hub-activity-section" className="tk-section">
        <h2>Recent Ecosystem Activity</h2>
        <div className="tk-card2">
          <h3>Latest Feed Activity</h3>
          {recentPosts.length === 0 ? (
            <p>Belum ada aktivitas post terbaru.</p>
          ) : (
            <ul className="tk-list">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <b>{post.title}</b>
                  <small>{post.post_type}</small>
                </li>
              ))}
            </ul>
          )}
          <Link className="tk-ghost" href="/business-feed">Lihat Semua Post di Feed</Link>
        </div>
        <div className="tk-card2">
          <h3>Recent Hub Actions</h3>
          <ul className="tk-list">
            {activityLog.map((entry, idx) => (
              <li key={"log-" + idx}>
                <span>{entry}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showEditSheet ? (
        <div className="tk-overlay">
          <div className="tk-sheet">
            <b>Edit Hub Headline and Focus</b>
            <form onSubmit={handleSaveIdentity} className="tk-form">
              <label>
                Headline
                <input value={identityNote.headline} onChange={(e) => setIdentityNote((prev) => ({ ...prev, headline: e.target.value }))} maxLength={140} />
              </label>
              <label>
                Summary
                <textarea rows={3} value={identityNote.summary} onChange={(e) => setIdentityNote((prev) => ({ ...prev, summary: e.target.value }))} maxLength={400} />
              </label>
              <label>
                Core Focus Areas
                <input value={identityNote.focusAreas} onChange={(e) => setIdentityNote((prev) => ({ ...prev, focusAreas: e.target.value }))} maxLength={180} />
              </label>
              <button className="tk-primary" type="submit" disabled={savingIdentity}>
                {savingIdentity ? "Menyimpan..." : "Simpan Ringkasan Hub"}
              </button>
              <button className="tk-ghost" type="button" onClick={() => setShowEditSheet(false)}>Batal</button>
            </form>
          </div>
        </div>
      ) : null}

      <nav className="tk-bottom">
        <Link href="/">Home</Link>
        <Link href="/explore">Explore</Link>
        <Link className="tk-plus" href="/business-feed">+</Link>
        <Link href="/v-circle">Circle</Link>
        <Link className="on" href="/v-hub">v-hub</Link>
      </nav>

      <footer className="tk-footer">
        v-nect v-hub - {currentUserId ? "Signed in" : "Public Preview"} - {new Date().getFullYear()} v-nect
      </footer>

      <AccountAuthModal
        open={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => syncHubData()}
      />

      <style jsx>{`
        .tk-page { min-height: 100vh; background: #000; color: #fff; padding-bottom: 92px; font-family: Arial, sans-serif; }
        .tk-top { position: sticky; top: 0; z-index: 50; background: #000; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #222; }
        .tk-brand { font-size: 22px; font-weight: 900; }
        .tk-brand span { color: #fe2c55; }
        .tk-brand small { display: block; font-size: 9px; letter-spacing: 2px; color: #aaa; }
        .tk-top-tabs { display: flex; gap: 14px; }
        .tk-top-tabs button { background: none; border: none; color: #aaa; font-weight: 800; cursor: pointer; }
        .tk-top-tabs button.on { color: #fff; border-bottom: 3px solid #fe2c55; }
        .tk-user { display: flex; gap: 8px; align-items: center; }
        .tk-user span { background: #1a1a1a; border: 1px solid #333; padding: 8px 12px; border-radius: 999px; font-size: 12px; }
        .tk-user button { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 8px 12px; border-radius: 999px; cursor: pointer; }
        .tk-login { background: #fe2c55; border: none; color: #fff; padding: 9px 14px; border-radius: 999px; font-weight: 800; cursor: pointer; }
        .tk-searchbar { max-width: 1100px; margin: 12px auto; padding: 0 16px; }
        .tk-searchbar input { width: 100%; box-sizing: border-box; background: #1a1a1a; border: 1px solid #222; border-radius: 999px; padding: 13px 16px; color: #fff; outline: none; }
        .tk-toast { margin: 12px 16px; background: #fe2c55; padding: 12px 14px; border-radius: 12px; display: flex; justify-content: space-between; font-weight: 700; }
        .tk-toast button { background: none; border: none; color: #fff; cursor: pointer; }
        .tk-profile { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
        .tk-cover { height: 140px; border-radius: 20px; background: linear-gradient(120deg, #fe2c55, #25f4ee, #7854ff); display: flex; align-items: flex-end; padding: 12px; font-size: 12px; }
        .tk-ava-big { width: 88px; height: 88px; border-radius: 50%; background: #111; border: 3px solid #fe2c55; display: grid; place-items: center; font-size: 34px; font-weight: 900; margin-top: -20px; margin-left: 12px; }
        .tk-profile h1 { font-size: 28px; margin: 12px 0 4px; }
        .tk-profile p { color: #bbb; margin: 6px 0; }
        .tk-headline { color: #fff !important; font-weight: 800; }
        .tk-summary { font-size: 14px; line-height: 1.6; }
        .tk-stats { display: flex; gap: 10px; margin: 12px 0; }
        .tk-stats div { background: #111; border: 1px solid #222; border-radius: 14px; padding: 12px 16px; text-align: center; }
        .tk-stats b { display: block; font-size: 20px; color: #fe2c55; }
        .tk-stats i { font-style: normal; font-size: 11px; color: #aaa; }
        .tk-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .tk-progress { height: 8px; background: #1a1a1a; border-radius: 999px; overflow: hidden; margin: 12px 0; }
        .tk-progress div { height: 100%; background: linear-gradient(90deg, #fe2c55, #25f4ee); }
        .tk-meta { color: #aaa; font-size: 12px; }
        .tk-section { max-width: 1100px; margin: 22px auto; padding: 0 16px; }
        .tk-section h2 { font-size: 22px; }
        .tk-feed { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
        .tk-card { background: #0a0a0a; border: 1px solid #1e1e1e; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .tk-card h3 { margin: 0; }
        .tk-card p { color: #bbb; font-size: 13px; line-height: 1.6; margin: 0; }
        .tk-badge { background: #fe2c55; padding: 4px 9px; border-radius: 999px; font-size: 11px; font-weight: 800; align-self: flex-start; }
        .tk-primary { background: #fe2c55; color: #fff; border: none; padding: 10px 14px; border-radius: 999px; font-weight: 800; cursor: pointer; text-decoration: none; display: inline-block; text-align: center; }
        .tk-joined { background: #222; color: #fff; border: 1px solid #444; padding: 10px 14px; border-radius: 999px; font-weight: 800; cursor: pointer; }
        .tk-ghost { background: #1a1a1a; color: #fff; border: 1px solid #333; padding: 10px 13px; border-radius: 999px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; text-align: center; }
        .tk-card2 { background: #111; border: 1px solid #222; border-radius: 16px; padding: 18px; margin-bottom: 14px; }
        .tk-chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
        .tk-chips button { background: #1a1a1a; border: 1px solid #222; color: #ddd; padding: 8px 13px; border-radius: 999px; cursor: pointer; }
        .tk-chips button.on { background: #fe2c55; color: #fff; }
        .tk-follow-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
        .tk-follow { background: #111; border: 1px solid #222; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .tk-follow h3 { margin: 0; }
        .tk-follow p { color: #bbb; font-size: 12px; margin: 0; }
        .tk-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .tk-list li { background: #000; border: 1px solid #222; padding: 10px 12px; border-radius: 10px; display: flex; flex-direction: column; font-size: 13px; }
        .tk-list small { color: #aaa; }
        .tk-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 80; display: flex; align-items: flex-end; justify-content: center; }
        .tk-sheet { background: #111; border-radius: 20px 20px 0 0; padding: 16px; width: 100%; max-width: 560px; max-height: 88vh; overflow: auto; }
        .tk-form { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
        .tk-form label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; }
        .tk-form input, .tk-form textarea { width: 100%; box-sizing: border-box; background: #000; border: 1px solid #333; color: #fff; padding: 11px; border-radius: 12px; }
        .tk-bottom { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; background: #000; border-top: 1px solid #222; display: flex; justify-content: space-around; padding: 12px 8px; }
        .tk-bottom a { color: #aaa; text-decoration: none; font-size: 14px; font-weight: 700; }
        .tk-bottom a.on { color: #fff; }
        .tk-plus { background: #fe2c55 !important; color: #fff !important; width: 52px; height: 34px; border-radius: 12px; display: grid !important; place-items: center; font-size: 22px !important; }
        .tk-footer { text-align: center; color: #777; font-size: 12px; padding: 22px; }
        @media (max-width: 760px) { .tk-top-tabs { display: none; } .tk-follow-grid { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
