"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { AccountAuthModal } from "@/components/AccountAuthModal";

type ProfessionalMember = {
  id: string;
  name: string;
  handle: string;
  avatarText: string;
  role: string;
  company: string;
  sector: "Founder & CEO" | "Product & Tech" | "Business & Partnerships" | "Marketing & Growth";
  location: string;
  bio: string;
  tags: string[];
  mutualConnections: number;
  online: boolean;
};

type NetworkCircle = {
  id: string;
  name: string;
  category: string;
  membersCount: number;
  description: string;
  focusLabel: string;
};

type ConnectionNoteMap = Record<string, string>;

const CIRCLE_STORAGE_KEY = "v-nect_v_circle_connections_v1";
const JOINED_GROUPS_STORAGE_KEY = "v-nect_v_circle_groups_v1";
const CONNECTION_NOTES_STORAGE_KEY = "v-nect_v_circle_notes_v1";

const INITIAL_PROFESSIONALS: ProfessionalMember[] = [
  {
    id: "pro-1",
    name: "Sophia Lee",
    handle: "@sophialee",
    avatarText: "SL",
    role: "Co-Founder & Product Lead",
    company: "Orbiss Commerce",
    sector: "Founder & CEO",
    location: "Singapore",
    bio: "Building cross-border commerce tools and video-first product showcases for emerging brands.",
    tags: ["B2B SaaS", "Product Strategy", "Video Commerce"],
    mutualConnections: 14,
    online: true,
  },
  {
    id: "pro-2",
    name: "James Carter",
    handle: "@jamescarter",
    avatarText: "JC",
    role: "Head of Strategic Partnerships",
    company: "Northbridge Ventures",
    sector: "Business & Partnerships",
    location: "Jakarta & SG",
    bio: "Connecting regional enterprise teams, supply partners, and growth-stage startups across APAC.",
    tags: ["Partnerships", "Enterprise", "Expansion"],
    mutualConnections: 21,
    online: true,
  },
  {
    id: "pro-3",
    name: "Olivia Bennett",
    handle: "@oliviabennett",
    avatarText: "OB",
    role: "Principal Design Systems Architect",
    company: "Studio Voin",
    sector: "Product & Tech",
    location: "Kuala Lumpur",
    bio: "Crafting cohesive multi-platform digital experiences with high clarity and responsive UI.",
    tags: ["Design Systems", "UI/UX", "Web Apps"],
    mutualConnections: 9,
    online: false,
  },
  {
    id: "pro-4",
    name: "Daniel Kim",
    handle: "@danielkim",
    avatarText: "DK",
    role: "VP of Regional Growth",
    company: "Kinetix Cloud",
    sector: "Marketing & Growth",
    location: "Seoul & ID",
    bio: "Scaling community-led growth, live product launches, and high-trust business networks.",
    tags: ["Community Growth", "GTM", "Go-To-Market"],
    mutualConnections: 17,
    online: true,
  },
  {
    id: "pro-5",
    name: "Mia Rodriguez",
    handle: "@miarodriguez",
    avatarText: "MR",
    role: "Operations & Trade Director",
    company: "Pacific Supply Co.",
    sector: "Business & Partnerships",
    location: "Manila & SG",
    bio: "Streamlining multi-market supplier onboarding and transparent business communications.",
    tags: ["Supply Chain", "Operations", "Cross-Border"],
    mutualConnections: 12,
    online: false,
  },
  {
    id: "pro-6",
    name: "Noah Smith",
    handle: "@noahsmith",
    avatarText: "NS",
    role: "Full-Stack Platform Engineer",
    company: "V-Nect Labs",
    sector: "Product & Tech",
    location: "Bekasi & Remote",
    bio: "Focused on fast web architecture, realtime collaboration, and clean cloud workflows.",
    tags: ["Next.js", "Supabase", "Realtime"],
    mutualConnections: 27,
    online: true,
  },
];

const INITIAL_CIRCLES: NetworkCircle[] = [
  {
    id: "circle-founders",
    name: "APAC Founders & Operators",
    category: "Leadership",
    membersCount: 428,
    description: "Weekly founder roundtables, product feedback loops, and operational playbooks.",
    focusLabel: "Active Discussions",
  },
  {
    id: "circle-commerce",
    name: "Brand & Video Commerce Hub",
    category: "Commerce",
    membersCount: 312,
    description: "Sharing short-form product clips, launch campaigns, and conversion experiments.",
    focusLabel: "Weekly Showcase",
  },
  {
    id: "circle-partners",
    name: "Global B2B & Channel Partners",
    category: "Alliances",
    membersCount: 256,
    description: "Find trusted regional distributors, agencies, and co-marketing collaborators.",
    focusLabel: "Partner Match",
  },
];

const SECTOR_FILTERS = [
  "All",
  "Founder & CEO",
  "Product & Tech",
  "Business & Partnerships",
  "Marketing & Growth",
] as const;

export default function VCirclePage() {
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [onlyOnline, setOnlyOnline] = useState(false);

  const [connectedIds, setConnectedIds] = useState<string[]>(["pro-1"]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>(["circle-founders"]);
  const [notesByMember, setNotesByMember] = useState<ConnectionNoteMap>({});
  const [activeNoteTargetId, setActiveNoteTargetId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [statusBanner, setStatusBanner] = useState("");

  useEffect(() => {
    try {
      const savedConn = window.localStorage.getItem(CIRCLE_STORAGE_KEY);
      if (savedConn) {
        const parsed = JSON.parse(savedConn);
        if (Array.isArray(parsed)) {
          setConnectedIds(parsed.filter((item): item is string => typeof item === "string"));
        }
      }

      const savedGroups = window.localStorage.getItem(JOINED_GROUPS_STORAGE_KEY);
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        if (Array.isArray(parsed)) {
          setJoinedGroupIds(parsed.filter((item): item is string => typeof item === "string"));
        }
      }

      const savedNotes = window.localStorage.getItem(CONNECTION_NOTES_STORAGE_KEY);
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        if (parsed && typeof parsed === "object") {
          setNotesByMember(parsed as ConnectionNoteMap);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CIRCLE_STORAGE_KEY, JSON.stringify(connectedIds));
    } catch {
      // Ignore storage errors
    }
  }, [connectedIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(JOINED_GROUPS_STORAGE_KEY, JSON.stringify(joinedGroupIds));
    } catch {
      // Ignore storage errors
    }
  }, [joinedGroupIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CONNECTION_NOTES_STORAGE_KEY, JSON.stringify(notesByMember));
    } catch {
      // Ignore storage errors
    }
  }, [notesByMember]);

  async function syncActiveUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCurrentUserId(null);
      setCurrentUserName(null);
      return;
    }

    setCurrentUserId(user.id);
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

    if (settings?.active_profile_type === "company" && settings.active_company_id) {
      const { data: companyData } = await supabase
        .from("companies")
        .select("company_name")
        .eq("id", settings.active_company_id)
        .maybeSingle();

      if (companyData?.company_name) {
        setCurrentUserName(companyData.company_name);
      }
    }
  }

  useEffect(() => {
    let active = true;
    syncActiveUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (active) {
        syncActiveUser();
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
    setCurrentUserName(null);
  }

  function toggleConnection(member: ProfessionalMember, customNote?: string) {
    const alreadyConnected = connectedIds.includes(member.id);

    if (alreadyConnected && !customNote) {
      setConnectedIds((prev) => prev.filter((id) => id !== member.id));
      setStatusBanner(`Koneksi dengan ${member.name} dilepas.`);
      return;
    }

    if (!alreadyConnected) {
      setConnectedIds((prev) => [...prev, member.id]);
    }

    if (customNote && customNote.trim()) {
      setNotesByMember((prev) => ({
        ...prev,
        [member.id]: customNote.trim(),
      }));
      setStatusBanner(`Permintaan & catatan koneksi terkirim ke ${member.name}.`);
    } else {
      setStatusBanner(`Terhubung dengan ${member.name} (${member.company}).`);
    }
  }

  function openNoteComposer(member: ProfessionalMember) {
    setActiveNoteTargetId(member.id);
    setDraftNote(notesByMember[member.id] || "");
  }

  function submitConnectionWithNote(member: ProfessionalMember) {
    toggleConnection(member, draftNote);
    setActiveNoteTargetId(null);
    setDraftNote("");
  }

  function toggleJoinCircle(circle: NetworkCircle) {
    const isJoined = joinedGroupIds.includes(circle.id);
    if (isJoined) {
      setJoinedGroupIds((prev) => prev.filter((id) => id !== circle.id));
      setStatusBanner(`Keluar dari circle "${circle.name}".`);
    } else {
      setJoinedGroupIds((prev) => [...prev, circle.id]);
      setStatusBanner(`Bergabung ke circle "${circle.name}".`);
    }
  }

  const filteredProfessionals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return INITIAL_PROFESSIONALS.filter((person) => {
      if (selectedSector !== "All" && person.sector !== selectedSector) {
        return false;
      }
      if (onlyOnline && !person.online) {
        return false;
      }
      if (!q) return true;

      return (
        person.name.toLowerCase().includes(q) ||
        person.company.toLowerCase().includes(q) ||
        person.role.toLowerCase().includes(q) ||
        person.location.toLowerCase().includes(q) ||
        person.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedSector, onlyOnline]);

  return (
    <main className="circle-page">
      <header className="circle-navbar">
        <div className="circle-nav-left">
          <Link href="/" className="circle-brand">
            v<span>-nect</span>
            <small>V-CIRCLE NETWORK</small>
          </Link>

          <nav className="circle-nav-links">
            <Link href="/">Home</Link>
            <Link href="/business-feed">Business Feed</Link>
            <Link href="/v-meet">v-meet</Link>
          </nav>
        </div>

        <div className="circle-nav-right">
          {currentUserName ? (
            <>
              <span className="circle-user-pill">● {currentUserName}</span>
              <button type="button" className="circle-ghost-btn" onClick={handleSignOut}>
                Keluar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="circle-ghost-btn"
              onClick={() => setAuthModalOpen(true)}
            >
              Masuk / Register
            </button>
          )}
        </div>
      </header>

      <section className="circle-container">
        <div className="circle-hero">
          <div>
            <span className="circle-eyebrow">MODULE 05 · PROFESSIONAL &amp; BUSINESS NETWORK</span>
            <h1>
              v-<span>circle.</span>
            </h1>
            <p>
              Meet professionals, discover verified business leaders, and grow high-trust circles across the v-nect ecosystem.
            </p>
          </div>

          <div className="circle-stats-box">
            <div className="circle-stat">
              <strong>{connectedIds.length}</strong>
              <span>Connections</span>
            </div>
            <div className="circle-stat">
              <strong>{joinedGroupIds.length}</strong>
              <span>Joined Circles</span>
            </div>
            <div className="circle-stat">
              <strong>{INITIAL_PROFESSIONALS.filter((p) => p.online).length}</strong>
              <span>Online Now</span>
            </div>
          </div>
        </div>

        {statusBanner && (
          <div className="circle-banner">
            <span>✓ {statusBanner}</span>
            <button type="button" onClick={() => setStatusBanner("")}>
              ✕
            </button>
          </div>
        )}

        <section className="circle-section">
          <div className="circle-section-head">
            <div>
              <span className="circle-eyebrow">CURATED COMMUNITIES</span>
              <h2>Active Network Circles</h2>
            </div>
            <Link href="/business-feed" className="circle-inline-link">
              Share Updates in Feed →
            </Link>
          </div>

          <div className="circle-groups-grid">
            {INITIAL_CIRCLES.map((group) => {
              const joined = joinedGroupIds.includes(group.id);
              const totalMembers = group.membersCount + (joined ? 1 : 0);

              return (
                <article className="circle-group-card" key={group.id}>
                  <div className="circle-group-top">
                    <span className="circle-badge">{group.category}</span>
                    <small>{totalMembers.toLocaleString()} members</small>
                  </div>
                  <h3>{group.name}</h3>
                  <p>{group.description}</p>
                  <div className="circle-group-foot">
                    <span className="circle-focus-pill">● {group.focusLabel}</span>
                    <button
                      type="button"
                      className={joined ? "circle-btn-joined" : "circle-btn-primary"}
                      onClick={() => toggleJoinCircle(group)}
                    >
                      {joined ? "Joined ✓" : "Join Circle"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="circle-section">
          <div className="circle-section-head">
            <div>
              <span className="circle-eyebrow">PEOPLE &amp; COMPANIES</span>
              <h2>Professionals in Your Circle</h2>
            </div>

            <button
              type="button"
              className={onlyOnline ? "circle-filter-chip active" : "circle-filter-chip"}
              onClick={() => setOnlyOnline((v) => !v)}
            >
              ● Online Only
            </button>
          </div>

          <div className="circle-toolbar">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, perusahaan, role, kota, atau keahlian..."
              className="circle-search-input"
            />

            <div className="circle-sector-list" role="tablist" aria-label="Filter Bidang">
              {SECTOR_FILTERS.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  className={
                    selectedSector === sector ? "circle-filter-chip active" : "circle-filter-chip"
                  }
                  onClick={() => setSelectedSector(sector)}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          {filteredProfessionals.length === 0 ? (
            <div className="circle-empty">
              <p>Tidak ada profil yang cocok dengan filter saat ini.</p>
              <button
                type="button"
                className="circle-btn-primary"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSector("All");
                  setOnlyOnline(false);
                }}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="circle-people-grid">
              {filteredProfessionals.map((person) => {
                const isConnected = connectedIds.includes(person.id);
                const savedNote = notesByMember[person.id];
                const isWritingNote = activeNoteTargetId === person.id;

                return (
                  <article className="circle-person-card" key={person.id}>
                    <div className="circle-person-top">
                      <div className="circle-person-identity">
                        <div className="circle-avatar-wrap">
                          <div className="circle-avatar">{person.avatarText}</div>
                          {person.online && <span className="circle-online-dot" title="Online" />}
                        </div>

                        <div>
                          <strong>{person.name}</strong>
                          <small>
                            {person.role} · <span>{person.company}</span>
                          </small>
                        </div>
                      </div>

                      <span className="circle-loc-pill">{person.location}</span>
                    </div>

                    <p className="circle-person-bio">{person.bio}</p>

                    <div className="circle-tags">
                      {person.tags.map((tag) => (
                        <span className="circle-tag" key={tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {savedNote && (
                      <div className="circle-saved-note">
                        <strong>Catatan koneksi:</strong> {savedNote}
                      </div>
                    )}

                    {isWritingNote && (
                      <div className="circle-note-box">
                        <input
                          type="text"
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value.slice(0, 180))}
                          placeholder={`Tulis pesan singkat untuk ${person.name}...`}
                        />
                        <div className="circle-note-actions">
                          <button
                            type="button"
                            className="circle-btn-primary"
                            onClick={() => submitConnectionWithNote(person)}
                          >
                            Kirim &amp; Connect
                          </button>
                          <button
                            type="button"
                            className="circle-btn-secondary"
                            onClick={() => setActiveNoteTargetId(null)}
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="circle-person-foot">
                      <small>{person.mutualConnections} mutual connections</small>

                      <div className="circle-card-actions">
                        <button
                          type="button"
                          className="circle-btn-secondary"
                          onClick={() => openNoteComposer(person)}
                        >
                          ✉ Note
                        </button>
                        <button
                          type="button"
                          className={isConnected ? "circle-btn-joined" : "circle-btn-primary"}
                          onClick={() => toggleConnection(person)}
                        >
                          {isConnected ? "Connected ✓" : "+ Connect"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      <footer className="circle-footer">
        v-nect v-circle · {currentUserId ? `Signed in as ${currentUserName}` : "Public Network Preview"} · ©{" "}
        {new Date().getFullYear()} v-nect
      </footer>

      <AccountAuthModal
        open={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => syncActiveUser()}
      />

      <style jsx>{`
        .circle-page {
          min-height: 100vh;
          background: #07111f;
          color: #eef4fb;
          font-family: var(--font-sans), Arial, sans-serif;
        }

        .circle-navbar {
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

        .circle-nav-left,
        .circle-nav-right {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .circle-brand {
          color: #ffffff;
          text-decoration: none;
          font-size: 21px;
          font-weight: 800;
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
        }

        .circle-brand span,
        .circle-hero h1 span {
          color: #13c8b5;
        }

        .circle-brand small {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
          color: #9cb0c9;
        }

        .circle-nav-links {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .circle-nav-links a {
          color: #d2deed;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .circle-nav-links a:hover {
          color: #13c8b5;
        }

        .circle-user-pill {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(19, 200, 181, 0.16);
          border: 1px solid rgba(19, 200, 181, 0.45);
          color: #7ee8dc;
          font-size: 12px;
          font-weight: 700;
        }

        .circle-ghost-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #eef4fb;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .circle-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 72px;
        }

        .circle-hero {
          background: linear-gradient(125deg, #102b4d, #134a66);
          border: 1px solid rgba(126, 232, 220, 0.2);
          border-radius: 18px;
          padding: 34px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .circle-eyebrow {
          display: inline-block;
          color: #13c8b5;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .circle-hero h1 {
          margin: 8px 0;
          font-size: 42px;
          font-weight: 800;
          line-height: 1.15;
        }

        .circle-hero p {
          margin: 0;
          color: #d2e2f3;
          font-size: 15px;
          line-height: 1.65;
          max-width: 560px;
        }

        .circle-stats-box {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .circle-stat {
          background: rgba(7, 17, 31, 0.55);
          border: 1px solid rgba(126, 232, 220, 0.22);
          border-radius: 12px;
          padding: 14px 18px;
          min-width: 105px;
          text-align: center;
        }

        .circle-stat strong {
          display: block;
          font-size: 24px;
          font-weight: 800;
          color: #7ee8dc;
        }

        .circle-stat span {
          font-size: 12px;
          color: #b5c7dd;
        }

        .circle-banner {
          margin-top: 18px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(19, 200, 181, 0.14);
          border: 1px solid rgba(19, 200, 181, 0.4);
          color: #9ff5eb;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .circle-banner button {
          border: none;
          background: transparent;
          color: #9ff5eb;
          font-size: 14px;
          cursor: pointer;
        }

        .circle-section {
          margin-top: 34px;
        }

        .circle-section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .circle-section-head h2 {
          margin: 4px 0 0;
          font-size: 26px;
          font-weight: 800;
        }

        .circle-inline-link {
          color: #7ee8dc;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
        }

        .circle-groups-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .circle-group-card,
        .circle-person-card {
          background: #0d1e34;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .circle-group-top,
        .circle-person-top,
        .circle-group-foot,
        .circle-person-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .circle-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(52, 124, 240, 0.2);
          color: #8cc0ff;
        }

        .circle-group-top small,
        .circle-person-foot small {
          color: #9ab0ca;
          font-size: 12px;
        }

        .circle-group-card h3 {
          margin: 2px 0 0;
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
        }

        .circle-group-card p,
        .circle-person-bio {
          margin: 0;
          color: #b7c8dd;
          font-size: 13px;
          line-height: 1.65;
        }

        .circle-focus-pill {
          font-size: 12px;
          font-weight: 700;
          color: #7ee8dc;
        }

        .circle-toolbar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 18px;
        }

        .circle-search-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 15px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: #0d1e34;
          color: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .circle-search-input:focus {
          border-color: #13c8b5;
        }

        .circle-sector-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .circle-filter-chip {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: #0d1e34;
          color: #c8d7ea;
          padding: 7px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .circle-filter-chip.active {
          background: rgba(19, 200, 181, 0.2);
          border-color: #13c8b5;
          color: #7ee8dc;
        }

        .circle-people-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .circle-person-identity {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .circle-avatar-wrap {
          position: relative;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
        }

        .circle-avatar {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1b3f6b, #145b79);
          color: #ffffff;
          font-weight: 800;
          font-size: 15px;
          display: grid;
          place-items: center;
        }

        .circle-online-dot {
          position: absolute;
          right: -2px;
          bottom: -2px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #13c8b5;
          border: 2px solid #0d1e34;
        }

        .circle-person-identity strong {
          display: block;
          font-size: 15px;
          color: #ffffff;
        }

        .circle-person-identity small {
          display: block;
          font-size: 12px;
          color: #9cb2cc;
          margin-top: 2px;
        }

        .circle-person-identity small span {
          color: #7ee8dc;
          font-weight: 600;
        }

        .circle-loc-pill {
          font-size: 11px;
          font-weight: 700;
          color: #b7c8dd;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 4px 10px;
          border-radius: 999px;
        }

        .circle-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .circle-tag {
          font-size: 11px;
          color: #8eb8e8;
          background: rgba(52, 124, 240, 0.12);
          padding: 3px 9px;
          border-radius: 6px;
        }

        .circle-saved-note {
          padding: 9px 12px;
          border-radius: 8px;
          background: rgba(19, 200, 181, 0.1);
          border: 1px solid rgba(19, 200, 181, 0.25);
          font-size: 12px;
          color: #cdeff0;
        }

        .circle-note-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px;
          border-radius: 10px;
          background: #091627;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .circle-note-box input {
          width: 100%;
          box-sizing: border-box;
          padding: 8px 10px;
          border-radius: 7px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: #0d1e34;
          color: #ffffff;
          font-size: 12px;
          outline: none;
        }

        .circle-note-actions,
        .circle-card-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .circle-btn-primary {
          border: none;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          padding: 8px 13px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .circle-btn-secondary {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          color: #dce8f6;
          padding: 8px 11px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .circle-btn-joined {
          border: 1px solid rgba(19, 200, 181, 0.45);
          background: rgba(19, 200, 181, 0.16);
          color: #7ee8dc;
          padding: 8px 13px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .circle-empty {
          background: #0d1e34;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 36px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .circle-footer {
          text-align: center;
          padding: 26px 20px;
          background: #050d18;
          color: #8fa4bf;
          font-size: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        @media (max-width: 900px) {
          .circle-groups-grid,
          .circle-people-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
