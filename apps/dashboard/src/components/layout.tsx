import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Activity, BarChart3, Boxes, Command, FileCheck2, FileText, GitBranch, Menu, Settings, ShieldCheck, Sparkles, X } from "lucide-react";
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
  const navigate = useNavigate();
  const paletteOpen = useDashboardStore((state) => state.commandPaletteOpen);
  const setPaletteOpen = useDashboardStore((state) => state.setCommandPaletteOpen);
  const sidebarOpen = useDashboardStore((state) => state.sidebarOpen);
  const setSidebarOpen = useDashboardStore((state) => state.setSidebarOpen);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen(true); }
      if (event.key === "Escape") { setPaletteOpen(false); setSidebarOpen(false); }
    };
    window.addEventListener("keydown", handleKeyDown); return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setPaletteOpen, setSidebarOpen]);
  return <div className="app-frame">
    {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className={cn("sidebar", sidebarOpen && "sidebar-open")}>
      <div className="sidebar-brand"><div className="brand-mark"><Activity size={17} /></div><span>Loom</span><span className="brand-version">v0.1</span><IconButton className="mobile-close" label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={17} /></IconButton></div>
      <div className="repo-switcher"><div className="repo-avatar">A</div><div><strong>{report.repository.name}</strong><span>{report.repository.branch}</span></div><span className="repo-chevron">⌄</span></div>
      <nav className="main-nav" aria-label="Primary navigation"><span className="nav-section-label">Workspace</span>{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setSidebarOpen(false)} className={({ isActive }) => cn("nav-link", isActive && "nav-link-active")}><Icon size={16} /><span>{label}</span>{label === "Findings" && <span className="nav-count">{report.summary.findings}</span>}</NavLink>)}<span className="nav-section-label nav-section-spaced">Manage</span><NavLink to="/settings" onClick={() => setSidebarOpen(false)} className={({ isActive }) => cn("nav-link", isActive && "nav-link-active")}><Settings size={16} /><span>Settings</span></NavLink></nav>
      <div className="sidebar-bottom"><div className="analysis-status"><span className="status-pulse" /><div><strong>Analysis complete</strong><span>{report.repository.commit.slice(0, 7)} · just now</span></div></div><button className="palette-hint" onClick={() => setPaletteOpen(true)}><Command size={14} />Quick find <Kbd>⌘ K</Kbd></button></div>
    </aside>
     <div className="content-frame"><header className="topbar"><IconButton className="mobile-menu" label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={18} /></IconButton><div className="breadcrumbs"><span className="crumb-muted">{report.repository.name}</span><span>/</span><strong>{location.pathname === "/" ? "Overview" : (navItems.find((item) => location.pathname.startsWith(item.to) && item.to !== "/")?.label ?? "Settings")}</strong></div><div className="topbar-actions"><SourceBadge label={sourceLabel} /><Button variant="ghost" size="sm" onClick={() => setPaletteOpen(true)}><Command size={14} /> <span className="hide-mobile">Command menu</span> <Kbd>⌘K</Kbd></Button></div></header><main className="page-content"><Outlet /></main><footer className="app-footer"><span>LOOM REPORT {report.version.replace("loom.report/", "").toUpperCase()}</span><span>Evidence-first change impact</span></footer></div>
    {paletteOpen && <CommandPalette report={report} />}
  </div>;
}

function CommandPalette({ report }: { report: LoomReport }) {
  const navigate = useNavigate(); const setOpen = useDashboardStore((state) => state.setCommandPaletteOpen); const [query, setQuery] = useState("");
  const actions = [{ label: "Open overview", hint: "Dashboard", to: "/", icon: BarChart3 }, { label: "Explore impact graph", hint: "Graph", to: "/graph", icon: GitBranch }, { label: "Review findings", hint: `${report.summary.findings} findings`, to: "/findings", icon: ShieldCheck }, { label: "Run verification", hint: "Checks", to: "/verification", icon: FileCheck2 }, { label: "Open reports", hint: "History", to: "/reports", icon: FileText }, { label: "Settings", hint: "Workspace", to: "/settings", icon: Settings }];
  const visible = actions.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><div className="command-palette" role="dialog" aria-modal="true" aria-label="Command menu"><div className="command-search"><Command size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and actions…" aria-label="Search commands" /><Kbd>ESC</Kbd></div><div className="command-list">{visible.length ? visible.map(({ label, hint, to, icon: Icon }) => <button key={to} className="command-item" onClick={() => { navigate(to); setOpen(false); }}><span className="command-item-icon"><Icon size={16} /></span><span>{label}</span><small>{hint}</small></button>) : <p className="command-empty">No commands match “{query}”.</p>}</div><div className="command-footer"><span><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span><span><Kbd>↵</Kbd> open</span></div></div></div>;
}
