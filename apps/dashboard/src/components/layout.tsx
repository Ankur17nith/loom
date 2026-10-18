import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, BarChart3, Clock3, Command, FileCheck2, FileText, FileUp, GitBranch, Menu, Search, Settings, ShieldCheck, Sparkles, X } from "lucide-react";
import { formatReportDate, reportStats, type LoomReport } from "../lib/report.js";
import { useDashboardStore } from "../store/dashboard-store.js";
import { Button, IconButton, Kbd, SourceBadge, cn } from "./ui.js";
import { LoomSymbol } from "./brand/loom-brand.js";

const navItems = [
  { to: "/", label: "Overview", icon: BarChart3 },
  { to: "/findings", label: "Findings", icon: ShieldCheck },
  { to: "/graph", label: "Impact graph", icon: GitBranch },
  { to: "/verification", label: "Verification", icon: FileCheck2 },
  { to: "/reports", label: "Reports", icon: FileText },
];

export function LoomMark({ className, size = 22 }: { className?: string; size?: number }) {
  return <LoomSymbol size={size} className={className} />;
}

export function AppLayout({
  report,
  sourceLabel = "Demo fixture · labeled",
  isDemo = false,
  isStale = false,
  onUnloadReport,
  onLoadFile,
}: {
  report: LoomReport;
  sourceLabel?: string;
  isDemo?: boolean;
  isStale?: boolean;
  onUnloadReport?: () => void;
  onLoadFile?: (file: File) => void;
}) {
  const stats = reportStats(report);
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paletteOpen = useDashboardStore((state) => state.commandPaletteOpen);
  const setPaletteOpen = useDashboardStore((state) => state.setCommandPaletteOpen);
  const sidebarOpen = useDashboardStore((state) => state.sidebarOpen);
  const setSidebarOpen = useDashboardStore((state) => state.setSidebarOpen);
  const activeLabel = location.pathname === "/" ? "Overview" : location.pathname === "/brand" ? "Brand identity" : navItems.find((item) => location.pathname.startsWith(item.to) && item.to !== "/")?.label ?? "Settings";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen(true); }
      if (event.key === "Escape") { setPaletteOpen(false); setSidebarOpen(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setPaletteOpen, setSidebarOpen]);

  return <div className="app-frame">
    <a className="skip-link" href="#main-content">Skip to content</a>
    {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className={cn("sidebar", sidebarOpen && "sidebar-open")}>
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true"><LoomMark /></div>
        <span className="brand-name">Loom</span>
        <span className="brand-version">v0.1.0</span>
        <IconButton className="mobile-close" label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={17} /></IconButton>
      </div>
      <div className="sidebar-repo"><span className="repo-pulse" /><div><strong>{report.repository.name}</strong><code>{report.repository.branch}</code></div></div>
      <nav className="main-nav" aria-label="Primary navigation"><span className="nav-section-label">Review</span>{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setSidebarOpen(false)} className={({ isActive }) => cn("nav-link", isActive && "nav-link-active")}><Icon size={16} aria-hidden="true" /><span>{label}</span>{label === "Findings" && stats.findings > 0 && <span className="nav-count">{stats.findings}</span>}</NavLink>)}<span className="nav-section-label nav-section-spaced">Workspace</span><NavLink to="/settings" onClick={() => setSidebarOpen(false)} className={({ isActive }) => cn("nav-link", isActive && "nav-link-active")}><Settings size={16} aria-hidden="true" /><span>Settings</span></NavLink><NavLink to="/brand" onClick={() => setSidebarOpen(false)} className={({ isActive }) => cn("nav-link", isActive && "nav-link-active")}><Sparkles size={16} aria-hidden="true" /><span>Brand identity</span></NavLink></nav>
      <div className="sidebar-footer">
        <SourceBadge label={sourceLabel} />
        {isDemo && onUnloadReport && (
          <button type="button" className="sidebar-exit-demo" onClick={onUnloadReport}>
            Exit demo mode
          </button>
        )}
        <div className="sidebar-status"><span className={cn("status-pip", `status-pip-${stats.verification}`)} /><span>{stats.verification === "passing" ? "Checks passing" : stats.verification === "not-run" ? "Checks not run" : "Review needs attention"}</span></div>
        <button className="palette-hint" type="button" onClick={() => setPaletteOpen(true)}><Search size={14} />Quick find<Kbd>⌘ K</Kbd></button>
      </div>
    </aside>
    <div className="content-frame">
      {isDemo && (
        <div className="demo-mode-banner" role="status" aria-label="Demo mode notice">
          <div className="demo-banner-content">
            <AlertTriangle size={15} aria-hidden="true" />
            <span><strong>Demo mode</strong> · Viewing synthetic contract-breakage fixture. Not live repository data.</span>
          </div>
          {onUnloadReport && (
            <button type="button" className="demo-exit-button" onClick={onUnloadReport}>
              Exit demo / Load real report
            </button>
          )}
        </div>
      )}
      {isStale && (
        <div className="stale-report-banner" role="status">
          <Clock3 size={15} aria-hidden="true" />
          <span><strong>Stale report</strong> · Generated on {formatReportDate(report.generatedAt)}. Rescan with <code>loom report</code> to refresh.</span>
        </div>
      )}
      <header className="topbar">
        <IconButton className="mobile-menu" label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={18} /></IconButton>
        <div className="topbar-title"><span>{report.repository.name}</span><span className="topbar-slash">/</span><strong>{activeLabel}</strong></div>
        <div className="review-context"><span><span className="context-dot" />{report.repository.branch}</span><span>base <code>{report.repository.baseCommit.slice(0, 7)}</code></span><span>commit <code>{report.repository.commit.slice(0, 7)}</code></span></div>
        <div className="topbar-actions">
          <SourceBadge label={sourceLabel} />
          {onLoadFile && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".json,application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onLoadFile(file);
                }}
              />
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} type="button">
                <FileUp size={14} aria-hidden="true" />
                <span className="hide-mobile">Open report</span>
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => setPaletteOpen(true)}><Command size={14} /><span className="hide-mobile">Command menu</span><Kbd>⌘K</Kbd></Button>
        </div>
      </header>
      <main id="main-content" className="page-content"><Outlet /></main>
      <footer className="app-footer"><span>LOOM REPORT {report.version.replace("loom.report/", "").toUpperCase()}</span><span>Read the evidence. Then act.</span></footer>
    </div>
    {paletteOpen && <CommandPalette report={report} />}
  </div>;
}

function CommandPalette({ report }: { report: LoomReport }) {
  const stats = reportStats(report);
  const navigate = useNavigate();
  const setOpen = useDashboardStore((state) => state.setCommandPaletteOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const actions = useMemo(() => [
    { label: "Open overview", hint: "Review cockpit", to: "/", icon: BarChart3 },
    { label: "Review findings", hint: `${stats.findings} evidence items`, to: "/findings", icon: ShieldCheck },
    { label: "Trace impact graph", hint: "Changed and affected nodes", to: "/graph", icon: GitBranch },
    { label: "Inspect verification", hint: "Attached checks", to: "/verification", icon: FileCheck2 },
    { label: "Open report artifact", hint: "Provenance and export", to: "/reports", icon: FileText },
    { label: "Open settings", hint: "Workspace configuration", to: "/settings", icon: Settings },
    { label: "Open brand identity", hint: "Loom design system & assets", to: "/brand", icon: Sparkles },
  ], [stats.findings]);
  const visible = actions.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => setActiveIndex(0), [query]);
  const open = (to: string) => { navigate(to); setOpen(false); };
  return <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><div className="command-palette" role="dialog" aria-modal="true" aria-labelledby="command-title"><div className="command-search"><Command size={17} aria-hidden="true" /><label id="command-title" className="sr-only">Command menu</label><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, visible.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); } if (event.key === "Enter" && visible[activeIndex]) open(visible[activeIndex].to); }} placeholder="Search pages and actions…" aria-label="Search commands" /><Kbd>ESC</Kbd></div><div className="command-list">{visible.length ? visible.map(({ label, hint, to, icon: Icon }, index) => <button key={to} className={cn("command-item", index === activeIndex && "command-item-active")} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => open(to)}><span className="command-item-icon"><Icon size={16} /></span><span>{label}</span><small>{hint}</small></button>) : <p className="command-empty">No commands match “{query}”.</p>}</div><div className="command-footer"><span><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span><span><Kbd>↵</Kbd> open</span><span><Kbd>esc</Kbd> close</span></div></div></div>;
}
