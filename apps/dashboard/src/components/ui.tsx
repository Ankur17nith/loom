import { useState, type ReactNode } from "react";
import { Check, Clipboard, ExternalLink, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { formatConfidence, type Finding, type FindingSeverity, type FindingStatus } from "../lib/report.js";

export function cn(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(" "); }

export function Button({ children, variant = "secondary", size = "md", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  return <button className={cn("button", `button-${variant}`, `button-${size}`, className)} {...props}>{children}</button>;
}

export function IconButton({ label, children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button className={cn("icon-button", className)} aria-label={label} title={label} {...props}>{children}</button>;
}

export function Panel({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("panel", className)} {...props}>{children}</section>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="page-header">
    <div><p className="eyebrow">{eyebrow ?? "Workspace"}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>;
}

const severityLabels: Record<FindingSeverity, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
export function SeverityBadge({ severity }: { severity: FindingSeverity }) { return <span className={cn("badge", `badge-${severity}`)}>{severityLabels[severity]}</span>; }
const statusLabels: Record<FindingStatus, string> = { open: "Open", reviewed: "Reviewed", resolved: "Resolved" };
export function StatusBadge({ status }: { status: FindingStatus }) { return <span className={cn("badge", `badge-${status}`)}>{statusLabels[status]}</span>; }

export function SourceBadge({ label = "Demo fixture · labeled" }: { label?: string }) { return <span className="source-badge"><span className="source-dot" />{label}</span>; }
export function Confidence({ finding }: { finding: Finding }) { return <span className="confidence"><span className="confidence-bar"><span style={{ width: `${finding.confidence * 100}%` }} /></span>{formatConfidence(finding.confidence)} confidence</span>; }

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(value); } catch { /* Clipboard may be unavailable in a restricted context. */ } setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <Button variant="ghost" size="sm" onClick={copy} aria-label={`${label}: ${value}`}><span className="button-icon">{copied ? <Check size={14} /> : <Clipboard size={14} />}</span>{copied ? "Copied" : label}</Button>;
}

export function EmptyState({ icon = <Info size={20} />, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{description}</p>{action}</div>;
}

export function ErrorState({ title = "Report unavailable", description = "The report could not be loaded. Check the report JSON and try again." }: { title?: string; description?: string }) {
  return <div className="error-state"><TriangleAlert size={18} /><div><strong>{title}</strong><p>{description}</p></div></div>;
}

export function LoadingState({ label = "Loading report" }: { label?: string }) { return <div className="loading-state" role="status"><LoaderCircle className="spin" size={18} />{label}…</div>; }

export function FindingRow({ finding, onOpen }: { finding: Finding; onOpen: () => void }) {
  return <button className="finding-row" onClick={onOpen} aria-label={`Open finding ${finding.title}`}>
    <div className="finding-severity-line"><SeverityBadge severity={finding.severity} /><span className="finding-category">{finding.category}</span></div>
    <div className="finding-row-main"><div><strong>{finding.title}</strong><p>{finding.summary}</p></div><ExternalLink size={15} className="row-arrow" /></div>
    <div className="finding-row-meta"><span>{finding.location.file}:{finding.location.line}</span><StatusBadge status={finding.status} /><Confidence finding={finding} /></div>
  </button>;
}

export function Kbd({ children }: { children: ReactNode }) { return <kbd>{children}</kbd>; }

export function InlineNotice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  return <div className={cn("inline-notice", `notice-${tone}`)}>{tone === "warning" ? <TriangleAlert size={15} /> : <Info size={15} />}<span>{children}</span></div>;
}

export function CloseButton({ onClick }: { onClick: () => void }) { return <IconButton label="Close" onClick={onClick}><X size={17} /></IconButton>; }
