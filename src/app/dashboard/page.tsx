
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
          "VOINNECT User";

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
          alert(
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
      alert("Unable to switch profile. Please try again.");
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
      alert("Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  const displayName = fullName || "VOINNECT User";

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
          background: "#f4f7fc",
          color: "#17243c",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 27,
              fontWeight: 800,
              letterSpacing: 2,
              marginBottom: 15,
            }}
          >
            VOIN<span style={{ color: "#438ce0" }}>NECT</span>
          </div>
          <p style={{ color: "#8490a2", fontSize: 13 }}>
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
          background: #f4f7fc;
          color: #17243c;
          font-family: Arial, Helvetica, sans-serif;
          overflow-x: hidden;
        }

        .vn-layout {
          display: flex;
          min-height: 100vh;
        }

        .vn-sidebar {
          width: 255px;
          flex-shrink: 0;
          background: #101d35;
          color: white;
          padding: 28px 18px;
          display: flex;
          flex-direction: column;
        }

        .vn-brand {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: 2px;
          padding: 5px 12px 35px;
        }

        .vn-brand span {
          color: #55a4ff;
        }

        .vn-side-label {
          color: #8291aa;
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
          color: #aab7ca;
          text-decoration: none;
          border-radius: 9px;
          font-size: 13px;
          cursor: pointer;
          border: 0;
          background: transparent;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }

        .vn-nav:hover,
        .vn-nav.active {
          background: #20395e;
          color: white;
        }

        .vn-nav.active {
          border-left: 3px solid #55a4ff;
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
          border-top: 1px solid #293750;
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
          font-weight: 800;
          letter-spacing: 1px;
        }

        .vn-top-right {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-left: auto;
        }

        .vn-search {
          border: 1px solid #e0e6f0;
          background: white;
          padding: 11px 15px;
          border-radius: 9px;
          color: #7c899f;
          font-size: 12px;
          width: 210px;
        }

        .vn-user {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .vn-avatar {
          width: 38px;
          height: 38px;
          background: #dceaff;
          color: #2465b5;
          display: grid;
          place-items: center;
          border-radius: 50%;
          font-weight: 800;
          font-size: 15px;
          flex-shrink: 0;
        }

        .vn-eyebrow {
          color: #4988d8;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }

        .vn-heading {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          margin: 0 0 8px;
          color: #15233d;
        }

        .vn-subtitle {
          color: #7b879a;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        .vn-hero {
          background: linear-gradient(115deg, #142849, #245a9d);
          border-radius: 17px;
          padding: 34px;
          color: white;
          margin: 27px 0 25px;
          position: relative;
          overflow: hidden;
        }

        .vn-hero::after {
          content: "V";
          position: absolute;
          right: 35px;
          top: -45px;
          font-size: 220px;
          line-height: 1;
          font-weight: 900;
          color: rgba(255,255,255,.055);
          pointer-events: none;
        }

        .vn-hero-label {
          font-size: 10px;
          letter-spacing: 2px;
          color: #b7d6ff;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .vn-hero h2 {
          font-size: 27px;
          margin: 0 0 12px;
          position: relative;
          z-index: 1;
        }

        .vn-hero p {
          color: #d0def0;
          font-size: 13px;
          line-height: 1.8;
          max-width: 570px;
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .vn-profile-panel {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 13px;
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
        }

        .vn-profile-description {
          font-size: 11px;
          color: #8490a3;
        }

        .vn-switcher {
          display: flex;
          padding: 4px;
          border-radius: 9px;
          background: #f0f3f8;
          gap: 4px;
        }

        .vn-switcher button {
          border: 0;
          border-radius: 7px;
          padding: 10px 17px;
          font-size: 12px;
          font-weight: 700;
          color: #77849a;
          background: transparent;
          cursor: pointer;
        }

        .vn-switcher button.selected {
          background: #2469b9;
          color: white;
          box-shadow: 0 3px 8px #2469b933;
        }

        .vn-switcher button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .vn-create-company {
          background: white;
          border: 1px solid #e4eaf3;
          border-radius: 13px;
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
        }

        .vn-create-company p {
          color: #8490a2;
          font-size: 12px;
          line-height: 1.6;
          margin: 0;
        }

        .vn-create-company button {
          border: 0;
          border-radius: 8px;
          padding: 12px 17px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          background: #2469b9;
          color: white;
        }

        .vn-company-form {
          background: white;
          border: 1px solid #e4eaf3;
          border-radius: 14px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .vn-company-form h2 {
          font-size: 22px;
          margin: 8px 0;
          color: #17243c;
        }

        .vn-company-form p {
          color: #8490a2;
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
          color: #34445d;
          margin-top: 8px;
        }

        .vn-company-form input,
        .vn-company-form textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #dfe6f0;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          resize: vertical;
        }

        .vn-company-form input:focus,
        .vn-company-form textarea:focus {
          border-color: #438ce0;
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
          background: #edf1f7;
          color: #52627a;
        }

        .vn-company-actions button:last-child {
          background: #2469b9;
          color: white;
        }

        .vn-company-actions button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .vn-company-error {
          color: #c0392b;
          background: #fff0ef;
          border-radius: 7px;
          padding: 11px;
          font-size: 12px;
        }

        .vn-company-list {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 13px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .vn-company-list h3 {
          font-size: 15px;
          margin: 0 0 14px;
        }

        .vn-company-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 13px 0;
          border-top: 1px solid #edf0f5;
        }

        .vn-company-item strong {
          font-size: 13px;
        }

        .vn-company-item button {
          border: 0;
          background: #edf4ff;
          color: #2469b9;
          padding: 9px 12px;
          border-radius: 7px;
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
        }

        .vn-count {
          font-size: 10px;
          letter-spacing: 1px;
          color: #71819a;
          font-weight: 700;
          white-space: nowrap;
        }

        .vn-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .vn-module {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 13px;
          padding: 22px;
          min-height: 205px;
          transition: .2s ease;
          min-width: 0;
        }

        .vn-module:hover {
          transform: translateY(-3px);
          border-color: #b6d4f6;
          box-shadow: 0 10px 25px #243d5b0d;
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
          background: #eaf3ff;
          color: #286fbe;
          font-size: 21px;
        }

        .vn-module-number {
          color: #a3aec0;
          font-size: 11px;
          font-weight: 700;
        }

        .vn-module h3 {
          font-size: 15px;
          margin: 0 0 9px;
          font-weight: 800;
        }

        .vn-module p {
          font-size: 11px;
          color: #8490a2;
          line-height: 1.7;
          min-height: 38px;
          margin: 0 0 17px;
        }

        .vn-coming {
          display: inline-block;
          background: #f0f4fa;
          color: #6380a4;
          border-radius: 5px;
          padding: 6px 9px;
          font-size: 9px;
          letter-spacing: 1px;
          font-weight: 800;
        }

        .vn-footer {
          text-align: center;
          color: #98a3b3;
          font-size: 10px;
          margin-top: 45px;
          padding-top: 22px;
          border-top: 1px solid #e6ebf2;
          line-height: 1.8;
        }

        .vn-mobile-menu {
          display: none;
          border: 1px solid #e0e6f0;
          background: white;
          color: #17243c;
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
            letter-spacing: .5px;
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
            letter-spacing: -.5px;
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
            letter-spacing: .5px;
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
              VOIN<span style={{ color: "#438ce0" }}>NECT</span>
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
                      color: "#8a96a9",
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

          <div id="overview">
            <div className="vn-eyebrow">
              VOINNECT ECOSYSTEM
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

            <h2>Welcome to VOINNECT.</h2>

            <p>
              One account. Multiple profiles. One ecosystem.
              Everything you need to connect, communicate and grow
              in a connected business world.
            </p>
          </div>

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
                Build your company's identity and become part of
                the VOINNECT business ecosystem.
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
                  VOINNECT business workspace.
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

                <h2>Explore VOINNECT</h2>
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
            © 2026 VOINNECT. All rights reserved.
            <br />
            Connect Beyond Boundaries.
          </div>
        </section>
      </div>
    </main>
  );
}
