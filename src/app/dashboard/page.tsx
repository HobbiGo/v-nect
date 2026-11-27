"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const modules = [
  {
    number: "01",
    icon: "✉",
    name: "VOIN Chat",
    description: "Connect and communicate with people and businesses.",
    category: "COMMUNICATION",
  },
  {
    number: "02",
    icon: "◎",
    name: "VOIN Connect",
    description: "Voice, video meetings and global collaboration.",
    category: "COLLABORATION",
  },
  {
    number: "03",
    icon: "▣",
    name: "VOIN Business",
    description: "Build your professional and company identity.",
    category: "BUSINESS",
  },
  {
    number: "04",
    icon: "◫",
    name: "Business Feed",
    description: "Discover business news, updates and opportunities.",
    category: "DISCOVERY",
  },
  {
    number: "05",
    icon: "◉",
    name: "VOIN Community",
    description: "Meet professionals and grow your network.",
    category: "NETWORKING",
  },
  {
    number: "06",
    icon: "◇",
    name: "VOIN Marketplace",
    description: "Explore products, services and global suppliers.",
    category: "MARKETPLACE",
  },
];

const guidelines = [
  {
    number: "01",
    title: "Sexual and Explicit Content",
    description:
      "No pornography, nudity, sexually explicit material, or inappropriate sexual content.",
  },
  {
    number: "02",
    title: "Violence and Graphic Content",
    description:
      "No graphic violence, disturbing imagery, or content that promotes physical harm.",
  },
  {
    number: "03",
    title: "Harassment and Hate Speech",
    description:
      "No bullying, threats, harassment, discrimination, or hate speech against others.",
  },
  {
    number: "04",
    title: "Scams and Misleading Information",
    description:
      "No fraud, spam, impersonation, fake business information, or deceptive activities.",
  },
  {
    number: "05",
    title: "Illegal and Copyright-Infringing Content",
    description:
      "No illegal activities, unauthorized copyrighted material, or content shared without proper rights.",
  },
  {
    number: "06",
    title: "Harmful and Dangerous Content",
    description:
      "No content that encourages dangerous activities or puts other people at risk.",
  },
];

type Company = {
  id: string;
  company_name: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState("Personal");
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState("");
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notice, setNotice] = useState("");

  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [companyError, setCompanyError] = useState("");

  const navigation = [
    { name: "Overview", icon: "▦", id: "overview" },
    { name: "Applications", icon: "◇", id: "applications" },
    { name: "My Profiles", icon: "◎", id: "profiles" },
    { name: "Activity", icon: "◷", id: "activity" },
    { name: "Community Guidelines", icon: "✓", id: "guidelines" },
  ];

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
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

        if (!mounted) return;

        setUserId(user.id);

        const [
          { data: profileData, error: profileError },
          { data: companyData, error: companyError },
          { data: settingsData, error: settingsError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("companies")
            .select("id, company_name")
            .eq("owner_id", user.id),

          supabase
            .from("account_settings")
            .select("active_profile_type, active_company_id")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (profileError) throw profileError;
        if (companyError) throw companyError;
        if (settingsError) throw settingsError;

        if (!mounted) return;

        const name =
          profileData?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "v-nect User";

        setFullName(name);

        const userCompanies = companyData || [];
        setCompanies(userCompanies);

        const savedProfile =
          settingsData?.active_profile_type || "personal";

        const savedCompanyId =
          settingsData?.active_company_id || "";

        const validCompany = userCompanies.find(
          (company) => company.id === savedCompanyId
        );

        if (savedProfile === "company" && validCompany) {
          setProfile("Company");
          setActiveCompanyId(validCompany.id);
        } else {
          setProfile("Personal");
          setActiveCompanyId("");
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);

        if (mounted) {
          setNotice(
            "Unable to load dashboard data. Please refresh the page."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [router]);

  const goToSection = (name: string, id: string) => {
    setActive(name);
    setMenuOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  async function createCompany(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!companyName.trim()) {
      setCompanyError("Please enter your company name.");
      return;
    }

    if (!userId) {
      setCompanyError(
        "User session not found. Please sign in again."
      );
      return;
    }

    setCreatingCompany(true);
    setCompanyError("");

    try {
      const supabase = createClient();

      const { data: newCompany, error: insertError } =
        await supabase
          .from("companies")
          .insert({
            owner_id: userId,
            company_name: companyName.trim(),
            description: companyDescription.trim() || null,
          })
          .select("id, company_name")
          .single();

      if (insertError) throw insertError;

      const { error: settingsError } = await supabase
        .from("account_settings")
        .update({
          active_profile_type: "company",
          active_company_id: newCompany.id,
        })
        .eq("user_id", userId);

      if (settingsError) throw settingsError;

      setCompanies((previous) => [
        ...previous,
        newCompany as Company,
      ]);

      setActiveCompanyId(newCompany.id);
      setProfile("Company");

      setCompanyName("");
      setCompanyDescription("");
      setShowCompanyForm(false);

      router.push("/company");
    } catch (error) {
      console.error("Create company error:", error);

      setCompanyError(
        error instanceof Error
          ? error.message
          : "Unable to create Company Profile."
      );
    } finally {
      setCreatingCompany(false);
    }
  }

  async function switchProfile(
    type: "Personal" | "Company",
    selectedCompanyId?: string
  ) {
    if (switching) return;

    if (type === "Personal" && profile === "Personal") {
      return;
    }

    if (
      type === "Company" &&
      profile === "Company" &&
      !selectedCompanyId
    ) {
      router.push("/company");
      return;
    }

    if (type === "Company" && companies.length === 0) {
      setShowCompanyForm(true);
      return;
    }

    setSwitching(true);
    setNotice("");

    try {
      const supabase = createClient();

      const companyId =
        type === "Company"
          ? selectedCompanyId || activeCompanyId || companies[0].id
          : null;

      const { error } = await supabase
        .from("account_settings")
        .update({
          active_profile_type:
            type === "Company" ? "company" : "personal",
          active_company_id: companyId,
        })
        .eq("user_id", userId);

      if (error) throw error;

      setProfile(type);
      setActiveCompanyId(companyId || "");

      if (type === "Company") {
        router.push("/company");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Profile switching error:", error);
      setNotice("Unable to switch profile. Please try again.");
    } finally {
      setSwitching(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      setNotice("Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  const displayName = fullName || "v-nect User";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const activeCompany = companies.find(
    (company) => company.id === activeCompanyId
  );

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(180deg, #060b24 0%, #091338 55%, #060b24 100%)",
          color: "#f3f7ff",
          fontFamily: "var(--font-sans), Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 27,
              fontWeight: 850,
              letterSpacing: 2,
              marginBottom: 15,
            }}
          >
            VOIN<span style={{ color: "#8ab4ff" }}>NECT</span>
          </div>
          <p style={{ color: "#9cb0d9", fontSize: 13 }}>
            Loading your workspace...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="vn-dashboard">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .vn-dashboard {
          min-height: 100vh;
          color: #f3f7ff;
          font-family: var(--font-sans), Arial, Helvetica, sans-serif;
          overflow-x: hidden;
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

        .vn-layout {
          display: flex;
          min-height: 100vh;
        }

        .vn-sidebar {
          width: 255px;
          flex-shrink: 0;
          background: rgba(6, 11, 36, 0.92);
          border-right: 1px solid rgba(138, 165, 255, 0.16);
          color: #f3f7ff;
          padding: 28px 18px;
          display: flex;
          flex-direction: column;
        }

        .vn-brand {
          font-size: 25px;
          font-weight: 850;
          letter-spacing: 2px;
          padding: 5px 12px 35px;
        }

        .vn-brand span {
          color: #8ab4ff;
        }

        .vn-side-label {
          color: #8ea3cc;
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 700;
          margin: 20px 12px 12px;
        }

        .vn-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          margin: 3px 0;
          color: #b8c7e6;
          text-decoration: none;
          border-radius: 10px;
          font-size: 13px;
          cursor: pointer;
          border: 0;
          background: transparent;
          width: 100%;
          text-align: left;
          font-family: inherit;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .vn-nav:hover,
        .vn-nav.active {
          background: rgba(92, 124, 255, 0.18);
          color: #ffffff;
        }

        .vn-nav.active {
          border-left: 3px solid #7854ff;
        }

        .vn-nav-icon {
          font-size: 17px;
          width: 22px;
          text-align: center;
          flex-shrink: 0;
        }

        .vn-sidebar-bottom {
          margin-top: auto;
          padding-top: 25px;
          border-top: 1px solid rgba(138, 165, 255, 0.16);
        }

        .vn-main {
          min-width: 0;
          flex: 1;
          padding: 28px 38px 45px;
        }

        .vn-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 35px;
        }

        .vn-mobile-brand {
          display: none;
          font-size: 21px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .vn-top-right {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-left: auto;
        }

        .vn-search {
          border: 1px solid rgba(138, 165, 255, 0.22);
          background: rgba(14, 24, 58, 0.85);
          padding: 11px 15px;
          border-radius: 10px;
          color: #9cb0d9;
          font-size: 12px;
          width: 210px;
        }

        .vn-user {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
        }

        .vn-avatar {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #4b6bff, #7854ff);
          color: #ffffff;
          display: grid;
          place-items: center;
          border-radius: 50%;
          font-weight: 800;
          font-size: 15px;
          flex-shrink: 0;
        }

        .vn-notice {
          margin-bottom: 20px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(92, 124, 255, 0.18);
          border: 1px solid rgba(138, 180, 255, 0.42);
          color: #dce7ff;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .vn-notice button {
          border: 0;
          background: transparent;
          color: #dce7ff;
          cursor: pointer;
          font-size: 14px;
        }

        .vn-eyebrow {
          color: #79a6ff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .vn-heading {
          font-size: 32px;
          font-weight: 850;
          letter-spacing: -1px;
          margin: 0 0 8px;
          color: #ffffff;
        }

        .vn-subtitle {
          color: #b8c7e6;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        .vn-hero {
          background: linear-gradient(
            125deg,
            rgba(22, 36, 82, 0.94),
            rgba(13, 24, 62, 0.98)
          );
          border: 1px solid rgba(138, 165, 255, 0.24);
          border-radius: 18px;
          padding: 34px;
          color: #ffffff;
          margin: 27px 0 25px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 14px 32px rgba(3, 8, 24, 0.36);
        }

        .vn-hero::after {
          content: "V";
          position: absolute;
          right: 35px;
          top: -45px;
          font-size: 220px;
          line-height: 1;
          font-weight: 900;
          color: rgba(138, 180, 255, 0.08);
          pointer-events: none;
        }

        .vn-hero-label {
          font-size: 10px;
          letter-spacing: 2px;
          color: #8ab4ff;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .vn-hero h2 {
          font-size: 27px;
          margin: 0 0 12px;
          position: relative;
          z-index: 1;
          color: #ffffff;
        }

        .vn-hero p {
          color: #b8c7e6;
          font-size: 13px;
          line-height: 1.8;
          max-width: 570px;
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .vn-tagline {
          display: block;
          color: #9ec0ff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin-top: 18px;
          position: relative;
          z-index: 1;
        }

        .vn-intro,
        .vn-guidelines,
        .vn-profile-panel,
        .vn-create-company,
        .vn-company-form,
        .vn-company-list,
        .vn-module {
          background: linear-gradient(
            160deg,
            rgba(20, 32, 72, 0.92),
            rgba(11, 19, 46, 0.96)
          );
          border: 1px solid rgba(138, 165, 255, 0.18);
          border-radius: 16px;
          color: #f3f7ff;
          box-shadow: 0 10px 24px rgba(3, 8, 24, 0.25);
        }

        .vn-intro {
          padding: 24px;
          margin-bottom: 25px;
        }

        .vn-intro h2 {
          font-size: 18px;
          margin: 0 0 10px;
          color: #ffffff;
        }

        .vn-intro p {
          color: #b8c7e6;
          font-size: 12px;
          line-height: 1.85;
          margin: 0;
        }

        .vn-guidelines {
          padding: 25px;
          margin: 25px 0 30px;
          scroll-margin-top: 20px;
        }

        .vn-guidelines-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 12px;
        }

        .vn-guidelines-heading h2 {
          font-size: 20px;
          margin: 0 0 8px;
          color: #ffffff;
        }

        .vn-guidelines-heading p {
          font-size: 12px;
          line-height: 1.7;
          color: #a9b9da;
          margin: 0;
        }

        .vn-guidelines-badge {
          background: rgba(92, 124, 255, 0.2);
          border: 1px solid rgba(138, 180, 255, 0.32);
          color: #9ec0ff;
          border-radius: 7px;
          padding: 8px 10px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .vn-guideline-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .vn-guideline-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(8, 16, 41, 0.78);
          border: 1px solid rgba(138, 165, 255, 0.14);
          border-radius: 12px;
          padding: 15px;
          min-width: 0;
        }

        .vn-guideline-number {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          background: rgba(92, 124, 255, 0.22);
          color: #9ec0ff;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
        }

        .vn-guideline-item h3 {
          font-size: 12px;
          margin: 1px 0 6px;
          color: #ffffff;
        }

        .vn-guideline-item p {
          font-size: 11px;
          line-height: 1.7;
          color: #a9b9da;
          margin: 0;
        }

        .vn-guidelines-warning {
          background: rgba(120, 84, 255, 0.14);
          border: 1px solid rgba(168, 142, 255, 0.34);
          border-radius: 10px;
          padding: 14px 16px;
          margin-top: 17px;
          color: #dce7ff;
          font-size: 11px;
          line-height: 1.8;
        }

        .vn-profile-panel {
          padding: 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }

        .vn-profile-title {
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 6px;
          color: #ffffff;
        }

        .vn-profile-description {
          font-size: 11px;
          color: #a9b9da;
        }

        .vn-switcher {
          display: flex;
          padding: 4px;
          border-radius: 10px;
          background: #081029;
          border: 1px solid rgba(138, 165, 255, 0.2);
          gap: 4px;
        }

        .vn-switcher button {
          border: 0;
          border-radius: 7px;
          padding: 10px 17px;
          font-size: 12px;
          font-weight: 700;
          color: #9cb0d9;
          background: transparent;
          cursor: pointer;
        }

        .vn-switcher button.selected {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(75, 107, 255, 0.3);
        }

        .vn-switcher button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .vn-create-company {
          padding: 22px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .vn-create-company h3 {
          font-size: 15px;
          margin: 0 0 7px;
          color: #ffffff;
        }

        .vn-create-company p {
          color: #a9b9da;
          font-size: 12px;
          line-height: 1.6;
          margin: 0;
        }

        .vn-create-company button {
          border: 0;
          border-radius: 9px;
          padding: 12px 17px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
        }

        .vn-company-form {
          padding: 25px;
          margin-bottom: 30px;
        }

        .vn-company-form h2 {
          font-size: 22px;
          margin: 8px 0;
          color: #ffffff;
        }

        .vn-company-form p {
          color: #a9b9da;
          font-size: 12px;
          line-height: 1.7;
          margin-bottom: 22px;
        }

        .vn-company-form form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .vn-company-form label {
          font-size: 12px;
          font-weight: 700;
          color: #c8d7f5;
          margin-top: 8px;
        }

        .vn-company-form input,
        .vn-company-form textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid rgba(138, 165, 255, 0.24);
          background: #081029;
          color: #f3f7ff;
          border-radius: 9px;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          resize: vertical;
        }

        .vn-company-form input::placeholder,
        .vn-company-form textarea::placeholder {
          color: #889bc2;
        }

        .vn-company-form input:focus,
        .vn-company-form textarea:focus {
          border-color: #7854ff;
        }

        .vn-company-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 15px;
        }

        .vn-company-actions button {
          border: 0;
          border-radius: 8px;
          padding: 12px 17px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-company-actions button:first-child {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(138, 165, 255, 0.24);
          color: #dce7ff;
        }

        .vn-company-actions button:last-child {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
        }

        .vn-company-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .vn-company-error {
          color: #fda4af;
          background: rgba(244, 63, 94, 0.16);
          border: 1px solid rgba(244, 63, 94, 0.42);
          border-radius: 8px;
          padding: 11px;
          font-size: 12px;
        }

        .vn-company-list {
          padding: 20px;
          margin-bottom: 30px;
        }

        .vn-company-list h3 {
          font-size: 15px;
          margin: 0 0 14px;
          color: #ffffff;
        }

        .vn-company-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 13px 0;
          border-top: 1px solid rgba(138, 165, 255, 0.14);
        }

        .vn-company-item strong {
          font-size: 13px;
          color: #ffffff;
        }

        .vn-company-item button {
          border: 1px solid rgba(138, 180, 255, 0.35);
          background: rgba(92, 124, 255, 0.2);
          color: #c7dcff;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          gap: 10px;
        }

        .vn-section-head h2 {
          font-size: 21px;
          margin: 0;
          font-weight: 800;
          color: #ffffff;
        }

        .vn-count {
          font-size: 10px;
          letter-spacing: 1px;
          color: #9ec0ff;
          font-weight: 700;
          white-space: nowrap;
          background: rgba(92, 124, 255, 0.16);
          border: 1px solid rgba(138, 180, 255, 0.28);
          padding: 6px 10px;
          border-radius: 999px;
        }

        .vn-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .vn-module {
          padding: 22px;
          min-height: 205px;
          transition: 0.2s ease;
          min-width: 0;
        }

        .vn-module:hover {
          transform: translateY(-3px);
          border-color: rgba(138, 180, 255, 0.45);
          box-shadow: 0 12px 26px rgba(3, 8, 24, 0.36);
        }

        .vn-module-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .vn-module-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: rgba(92, 124, 255, 0.2);
          border: 1px solid rgba(138, 180, 255, 0.3);
          color: #9ec0ff;
          font-size: 21px;
        }

        .vn-module-number {
          color: #8ea3cc;
          font-size: 11px;
          font-weight: 700;
        }

        .vn-module h3 {
          font-size: 15px;
          margin: 0 0 9px;
          font-weight: 800;
          color: #ffffff;
        }

        .vn-module p {
          font-size: 11px;
          color: #a9b9da;
          line-height: 1.7;
          min-height: 38px;
          margin: 0 0 17px;
        }

        .vn-coming {
          display: inline-block;
          background: rgba(92, 124, 255, 0.16);
          border: 1px solid rgba(138, 180, 255, 0.26);
          color: #c7dcff;
          border-radius: 6px;
          padding: 6px 9px;
          font-size: 9px;
          letter-spacing: 1px;
          font-weight: 800;
        }

        .vn-footer {
          text-align: center;
          color: #96a8d0;
          font-size: 10px;
          margin-top: 45px;
          padding-top: 22px;
          border-top: 1px solid rgba(138, 165, 255, 0.16);
          line-height: 1.8;
        }

        .vn-mobile-menu {
          display: none;
          border: 1px solid rgba(138, 165, 255, 0.26);
          background: rgba(14, 24, 58, 0.88);
          color: #f3f7ff;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 18px;
          cursor: pointer;
          flex-shrink: 0;
        }

        @media (max-width: 1050px) {
          .vn-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .vn-main {
            padding: 25px;
          }
        }

        @media (max-width: 700px) {
          .vn-layout {
            display: block;
            width: 100%;
          }

          .vn-sidebar {
            display: none;
            width: 100%;
            min-height: auto;
            padding: 18px 16px;
            border-radius: 0 0 14px 14px;
            border-right: 0;
            border-bottom: 1px solid rgba(138, 165, 255, 0.16);
          }

          .vn-sidebar.open {
            display: flex;
          }

          .vn-brand {
            font-size: 22px;
            padding: 5px 10px 18px;
          }

          .vn-side-label {
            margin: 14px 10px 9px;
          }

          .vn-nav {
            padding: 12px;
            min-height: 44px;
          }

          .vn-sidebar-bottom {
            margin-top: 18px;
            padding-top: 15px;
          }

          .vn-main {
            width: 100%;
            padding: 16px 15px 30px;
          }

          .vn-topbar {
            width: 100%;
            gap: 10px;
            margin-bottom: 27px;
            min-height: 42px;
          }

          .vn-mobile-menu {
            display: block;
            width: 42px;
            height: 42px;
            padding: 0;
            font-size: 19px;
          }

          .vn-mobile-brand {
            display: block;
            font-size: 18px;
            letter-spacing: 0.5px;
            white-space: nowrap;
          }

          .vn-top-right {
            gap: 8px;
            margin-left: auto;
          }

          .vn-search {
            display: none;
          }

          .vn-user {
            gap: 0;
          }

          .vn-user-name {
            display: none;
          }

          .vn-avatar {
            width: 35px;
            height: 35px;
            font-size: 14px;
          }

          .vn-eyebrow {
            font-size: 9px;
            letter-spacing: 1.5px;
            margin-bottom: 8px;
          }

          .vn-heading {
            font-size: 27px;
            letter-spacing: -0.5px;
          }

          .vn-subtitle {
            font-size: 12px;
            line-height: 1.6;
          }

          .vn-hero {
            padding: 25px 20px;
            margin: 22px 0 20px;
            border-radius: 14px;
          }

          .vn-hero-label {
            font-size: 9px;
            letter-spacing: 1.5px;
            margin-bottom: 12px;
          }

          .vn-hero h2 {
            font-size: 22px;
            line-height: 1.3;
            max-width: 250px;
          }

          .vn-hero p {
            font-size: 12px;
            line-height: 1.75;
            max-width: 100%;
          }

          .vn-hero::after {
            right: 0;
            top: -15px;
            font-size: 125px;
          }

          .vn-tagline {
            font-size: 10px;
            line-height: 1.6;
          }

          .vn-intro {
            padding: 19px;
          }

          .vn-guidelines {
            padding: 18px;
            margin: 20px 0 25px;
          }

          .vn-guidelines-heading {
            flex-direction: column;
          }

          .vn-guidelines-heading h2 {
            font-size: 18px;
          }

          .vn-guideline-list {
            grid-template-columns: minmax(0, 1fr);
            gap: 10px;
          }

          .vn-guideline-item {
            padding: 13px;
          }

          .vn-profile-panel {
            flex-direction: column;
            align-items: stretch;
            gap: 17px;
            padding: 18px;
            margin-bottom: 20px;
          }

          .vn-profile-title {
            font-size: 14px;
          }

          .vn-profile-description {
            font-size: 11px;
            line-height: 1.6;
          }

          .vn-switcher {
            width: 100%;
            display: flex;
          }

          .vn-switcher button {
            flex: 1;
            padding: 12px 8px;
            font-size: 12px;
            min-height: 42px;
          }

          .vn-create-company {
            flex-direction: column;
            align-items: stretch;
          }

          .vn-create-company button {
            width: 100%;
          }

          .vn-company-form {
            padding: 18px;
          }

          .vn-company-actions {
            flex-direction: column-reverse;
          }

          .vn-company-actions button {
            width: 100%;
          }

          .vn-company-item {
            align-items: flex-start;
          }

          .vn-section-head {
            align-items: flex-end;
            margin-bottom: 15px;
          }

          .vn-section-head h2 {
            font-size: 19px;
          }

          .vn-count {
            font-size: 9px;
            letter-spacing: 0.5px;
          }

          .vn-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
          }

          .vn-module {
            min-height: auto;
            padding: 18px;
            border-radius: 12px;
          }

          .vn-module-top {
            margin-bottom: 14px;
          }

          .vn-module-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .vn-module h3 {
            font-size: 15px;
            margin-bottom: 7px;
          }

          .vn-module p {
            font-size: 12px;
            line-height: 1.65;
            min-height: 0;
            margin-bottom: 13px;
          }

          .vn-coming {
            font-size: 9px;
            padding: 6px 9px;
          }

          .vn-footer {
            margin-top: 30px;
            padding-top: 18px;
            font-size: 9px;
          }
        }

        @media (max-width: 380px) {
          .vn-main {
            padding-left: 12px;
            padding-right: 12px;
          }

          .vn-mobile-brand {
            font-size: 16px;
          }

          .vn-heading {
            font-size: 25px;
          }

          .vn-hero {
            padding: 22px 17px;
          }

          .vn-hero h2 {
            font-size: 20px;
          }

          .vn-profile-panel {
            padding: 15px;
          }

          .vn-module {
            padding: 16px;
          }
        }
      `}</style>

      <div className="vn-layout">
        <aside className={`vn-sidebar ${menuOpen ? "open" : ""}`}>
          <div className="vn-brand">
            VOIN<span>NECT</span>
          </div>

          <div className="vn-side-label">WORKSPACE</div>

          {navigation.map((item) => (
            <button
              key={item.name}
              className={`vn-nav ${
                active === item.name ? "active" : ""
              }`}
              onClick={() => goToSection(item.name, item.id)}
            >
              <span className="vn-nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}

          <div className="vn-side-label">ECOSYSTEM</div>

          {modules.map((item) => (
            <button
              key={item.name}
              className="vn-nav"
              onClick={() =>
                goToSection(item.name, "applications")
              }
            >
              <span className="vn-nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}

          <div className="vn-sidebar-bottom">
            <button
              className="vn-nav"
              onClick={() => {
                setActive("Settings");
                setMenuOpen(false);
              }}
            >
              <span className="vn-nav-icon">⚙</span>
              Settings
            </button>

            <button
              className="vn-nav"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <span className="vn-nav-icon">↪</span>
              {signingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </aside>

        <section className="vn-main">
          <header className="vn-topbar">
            <button
              className="vn-mobile-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? "✕" : "☰"}
            </button>

            <div className="vn-mobile-brand">
              VOIN<span style={{ color: "#8ab4ff" }}>NECT</span>
            </div>

            <div className="vn-top-right">
              <div className="vn-search">
                ⌕ Search workspace...
              </div>

              <div className="vn-user">
                <div className="vn-avatar">
                  {initials || "U"}
                </div>

                <div className="vn-user-name">
                  Welcome {displayName}
                  <div
                    style={{
                      color: "#9cb0d9",
                      fontWeight: 400,
                      marginTop: 4,
                    }}
                  >
                    {profile} Profile
                  </div>
                </div>
              </div>
            </div>
          </header>

          {notice && (
            <div className="vn-notice">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")}>
                ✕
              </button>
            </div>
          )}

          <div id="overview">
            <div className="vn-eyebrow">
              GLOBAL BUSINESS COMMUNICATION & ECOSYSTEM PLATFORM
            </div>

            <h1 className="vn-heading">Dashboard</h1>

            <p className="vn-subtitle">
              Your connected workspace. Everything starts here.
            </p>
          </div>

          <div className="vn-hero">
            <div className="vn-hero-label">
              YOUR DIGITAL ECOSYSTEM
            </div>

            <h2>Welcome to v-nect.</h2>

            <p>
              v-nect is an integrated digital platform designed
              to connect businesses, professionals, communities,
              and opportunities through communication,
              collaboration, networking, and business solutions.
            </p>

            <span className="vn-tagline">
              CONNECT BEYOND BOUNDARIES.
            </span>
          </div>

          <section className="vn-intro">
            <div className="vn-eyebrow">ABOUT v-nect</div>

            <h2>Building a More Connected Business World.</h2>

            <p>
              Our vision is to build a connected global business
              ecosystem where people and organizations can
              communicate, collaborate, discover opportunities,
              and grow together. v-nect brings communication,
              professional networking, business discovery,
              product presentations, communities, and marketplace
              capabilities into one connected environment.
            </p>
          </section>

          <section className="vn-guidelines" id="guidelines">
            <div className="vn-guidelines-heading">
              <div>
                <div className="vn-eyebrow">
                  COMMUNITY STANDARDS
                </div>

                <h2>v-nect Community Guidelines</h2>

                <p>
                  Help us maintain a safe, respectful, and
                  professional environment for everyone.
                </p>
              </div>

              <span className="vn-guidelines-badge">
                PLEASE READ
              </span>
            </div>

            <div className="vn-guideline-list">
              {guidelines.map((item) => (
                <article
                  className="vn-guideline-item"
                  key={item.number}
                >
                  <div className="vn-guideline-number">
                    {item.number}
                  </div>

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="vn-guidelines-warning">
              <strong>Important:</strong> Content that violates
              these guidelines may be rejected, removed, or result
              in account restrictions in accordance with v-nect
              policies. Users are responsible for the content they
              publish and share.
            </div>
          </section>

          <div className="vn-profile-panel" id="profiles">
            <div>
              <div className="vn-eyebrow">
                ACTIVE PROFILE
              </div>

              <div className="vn-profile-title">
                Choose your workspace
              </div>

              <div className="vn-profile-description">
                {profile === "Company" && activeCompany
                  ? `Active company: ${activeCompany.company_name}`
                  : "Switch between your personal and company identity."}
              </div>
            </div>

            <div className="vn-switcher">
              <button
                className={
                  profile === "Personal" ? "selected" : ""
                }
                onClick={() => switchProfile("Personal")}
                disabled={switching}
              >
                ◎ Personal
              </button>

              <button
                className={
                  profile === "Company" ? "selected" : ""
                }
                onClick={() => switchProfile("Company")}
                disabled={switching}
              >
                ▣ Company
              </button>
            </div>
          </div>

          {showCompanyForm && (
            <div className="vn-company-form">
              <div className="vn-eyebrow">
                COMPANY REGISTRATION
              </div>

              <h2>Create Your Company Profile</h2>

              <p>
                Build your company&apos;s identity and become part of
                the v-nect business ecosystem.
              </p>

              <form onSubmit={createCompany}>
                <label htmlFor="companyName">
                  Company Name
                </label>

                <input
                  id="companyName"
                  type="text"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(event) =>
                    setCompanyName(event.target.value)
                  }
                  required
                  maxLength={150}
                />

                <label htmlFor="companyDescription">
                  Company Description
                </label>

                <textarea
                  id="companyDescription"
                  placeholder="Tell us about your company..."
                  value={companyDescription}
                  onChange={(event) =>
                    setCompanyDescription(event.target.value)
                  }
                  rows={4}
                  maxLength={2000}
                />

                {companyError && (
                  <div className="vn-company-error">
                    {companyError}
                  </div>
                )}

                <div className="vn-company-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompanyForm(false);
                      setCompanyError("");
                    }}
                    disabled={creatingCompany}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creatingCompany}
                  >
                    {creatingCompany
                      ? "Creating..."
                      : "Create Company"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!showCompanyForm && (
            <div className="vn-create-company">
              <div>
                <h3>Build Your Business Identity</h3>
                <p>
                  Create a company profile to access your
                  v-nect business workspace.
                </p>
              </div>

              <button
                onClick={() => {
                  setCompanyError("");
                  setShowCompanyForm(true);
                }}
              >
                + Create Company Profile
              </button>
            </div>
          )}

          {companies.length > 0 && (
            <div className="vn-company-list">
              <h3>My Company Profiles</h3>

              {companies.map((company) => (
                <div
                  className="vn-company-item"
                  key={company.id}
                >
                  <strong>{company.company_name}</strong>

                  <button
                    onClick={() =>
                      switchProfile("Company", company.id)
                    }
                    disabled={
                      switching &&
                      activeCompanyId === company.id
                    }
                  >
                    {activeCompanyId === company.id
                      ? "Active Company"
                      : "Switch to Company"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div id="applications">
            <div className="vn-section-head">
              <div>
                <div className="vn-eyebrow">
                  YOUR APPLICATIONS
                </div>

                <h2>Explore v-nect</h2>
              </div>

              <div className="vn-count">06 MODULES</div>
            </div>

            <div className="vn-grid">
              {modules.map((item) => (
                <article
                  className="vn-module"
                  key={item.number}
                >
                  <div className="vn-module-top">
                    <div className="vn-module-icon">
                      {item.icon}
                    </div>

                    <div className="vn-module-number">
                      {item.number}
                    </div>
                  </div>

                  <h3>{item.name}</h3>

                  <p>{item.description}</p>

                  <span className="vn-coming">
                    COMING SOON
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div id="activity" className="vn-footer">
            © 2026 v-nect. All rights reserved.
            <br />
            Global Business Communication & Ecosystem Platform.
            <br />
            Connect Beyond Boundaries.
          </div>
        </section>
      </div>
    </main>
  );
}
