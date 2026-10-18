import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Activity, BarChart3, Command, FileCheck2, FileText, GitBranch, Menu, Settings, ShieldCheck, X } from "lucide-react";
import { useDashboardStore } from "../store/dashboard-store.js";
import { Button, IconButton, Kbd, SourceBadge, cn } from "./ui.js";
import type { LoomReport } from "../lib/report.js";

const navItems = [
  { to: "/", label: "Overview", icon: BarChart3 },
  { to: "/graph", label: "Impact graph", icon: GitBranch },
  { to: "/findings", label: "Findings", icon: ShieldCheck },
  { to: "/verification", label: "Verification", icon: FileCheck2 },
  { to: "/reports", label: "Reports", icon: FileText },
];

export function AppLayout({ report, sourceLabel = "Demo fixture · labeled" }: { report: LoomReport; sourceLabel?: string }) {
  const location = useLocation();
  const paletteOpen = useDashboardStore((state) => state.commandPaletteOpen);
  const setPaletteOpen = useDashboardStore((state) => state.setCommandPaletteOpen);
  const sidebarOpen = useDashboardStore((state) => state.sidebarOpen);
  const setSidebarOpen = useDashboardStore((state) => state.setSidebarOpen);
  const activeLabel = location.pathname === "/" ? "Overview" : navItems.find((item) => location.pathname.startsWith(item.to) && item.to !== "/")?.label ?? "Settings";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setPaletteOpen, setSidebarOpen]);

  return <div className="app-frame">
    {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className={cn("sidebar", sidebarOpen && "sidebar-open")}>
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true"><Activity size={16} strokeWidth={2.4} /></div>
        <span className="brand-name">Loom</span>
        <span className="brand-version">0.1</span>
        <IconButton className="mobile-close" label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={17} /></IconButton>
      </div>
      <div className="repo-switcher" aria-label={`Repository ${report.repository.name} on ${report.repository.branch}`}>
        <div className="repo-avatar" aria-hidden="true">{report.repository.name.slice(0, 1).toUpperCase()}</div>
        <div className="repo-switcher-copy"><strong>{report.repository.name}</strong><span><code>{report.repository.branch}</code></span></div>
        <span className="repo-chevron" aria-hidden="true">⌄</span>
      </div>
      <nav className="main-nav" aria-label="Primary navigation">
        <span className="nav-section-label">Workspace</span>
        {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setSidebarOpen(false)} className={({ isActive }) => cn("nav-link", isActive && "nav-link-active")}><Icon size={16} aria-hidden="true" /><span>{label}</span>{label === "Findings" && <span className="nav-count" aria-label={`${report.summary.findings} findings`}>{report.summary.findings}</span>}</NavLink>)}
        <span className="nav-section-label nav-section-spaced">Workspace config</span>
        <NavLink to="/settings" onClick={() => setSidebarOpen(false)} className={({ isActive }) => cn("nav-link", isActive && "nav-link-active")}><Settings size={16} aria-hidden="true" /><span>Settings</span></NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div className="analysis-status"><span className="status-pulse" aria-hidden="true" /><div><strong>Report ready</strong><span><code>{report.repository.commit.slice(0, 7)}</code> · {sourceLabel.toLowerCase().includes("demo") ? "preview" : "imported"}</span></div></div>
        <button className="palette-hint" onClick={() => setPaletteOpen(true)}><Command size={14} aria-hidden="true" />Quick find <Kbd>⌘ K</Kbd></button>
      </div>
    </aside>
    <div className="content-frame">
      <header className="topbar">
        <IconButton className="mobile-menu" label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={18} /></IconButton>
        <div className="breadcrumbs"><span className="crumb-muted">{report.repository.name}</span><span aria-hidden="true">/</span><strong>{activeLabel}</strong></div>
        <div className="topbar-context"><span className="context-item"><span className="context-dot" aria-hidden="true" />{report.repository.branch}</span><span className="context-item"><span className="context-dot context-dot-blue" aria-hidden="true" />base <code>{report.repository.baseCommit.slice(0, 7)}</code></span></div>
        <div className="topbar-actions"><SourceBadge label={sourceLabel} /><Button variant="ghost" size="sm" onClick={() => setPaletteOpen(true)}><Command size={14} aria-hidden="true" /><span className="hide-mobile">Command menu</span><Kbd>⌘K</Kbd></Button></div>
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="app-footer"><span>LOOM REPORT {report.version.replace("loom.report/", "").toUpperCase()}</span><span>Evidence before aesthetics</span></footer>
    </div>
    {paletteOpen && <CommandPalette report={report} />}
  </div>;
}

function CommandPalette({ report }: { report: LoomReport }) {
  const navigate = useNavigate();
  const setOpen = useDashboardStore((state) => state.setCommandPaletteOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const actions = useMemo(() => [
    { label: "Open overview", hint: "Repository summary", to: "/", icon: BarChart3 },
    { label: "Explore impact graph", hint: "Trace dependency paths", to: "/graph", icon: GitBranch },
    { label: "Review findings", hint: `${report.summary.findings} findings`, to: "/findings", icon: ShieldCheck },
    { label: "Open verification", hint: "Captured checks", to: "/verification", icon: FileCheck2 },
    { label: "Open reports", hint: "Versioned artifacts", to: "/reports", icon: FileText },
    { label: "Open settings", hint: "Workspace configuration", to: "/settings", icon: Settings },
  ], [report.summary.findings]);
  const visible = actions.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => setActiveIndex(0), [query]);
  const open = (to: string) => { navigate(to); setOpen(false); };
  return <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
    <div className="command-palette" role="dialog" aria-modal="true" aria-labelledby="command-title">
      <div className="command-search"><Command size={17} aria-hidden="true" /><label id="command-title" className="sr-only">Command menu</label><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, visible.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); } if (event.key === "Enter" && visible[activeIndex]) open(visible[activeIndex].to); }} placeholder="Search pages and actions…" aria-label="Search commands" /><Kbd>ESC</Kbd></div>
      <div className="command-list">{visible.length ? visible.map(({ label, hint, to, icon: Icon }, index) => <button key={to} className={cn("command-item", index === activeIndex && "command-item-active")} onMouseEnter={() => setActiveIndex(index)} onClick={() => open(to)}><span className="command-item-icon"><Icon size={16} aria-hidden="true" /></span><span>{label}</span><small>{hint}</small></button>) : <p className="command-empty">No commands match “{query}”.</p>}</div>
      <div className="command-footer"><span><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span><span><Kbd>↵</Kbd> open</span><span><Kbd>esc</Kbd> close</span></div>
    </div>
  </div>;
}
