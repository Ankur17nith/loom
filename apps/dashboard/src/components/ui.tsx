import { useState, type ReactNode } from "react";
import { Check, Clipboard, ExternalLink, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { formatConfidence, type Finding, type FindingSeverity, type FindingStatus } from "../lib/report.js";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

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
    <div className="page-heading-copy"><p className="eyebrow">{eyebrow ?? "Workspace"}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>;
}

const severityLabels: Record<FindingSeverity, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
export function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  return <span className={cn("badge", `badge-${severity}`)}><span className="badge-dot" aria-hidden="true" />{severityLabels[severity]}</span>;
}

const statusLabels: Record<FindingStatus, string> = { open: "Open", reviewed: "Reviewed", resolved: "Resolved" };
export function StatusBadge({ status }: { status: FindingStatus }) {
  return <span className={cn("badge", `badge-${status}`)}><span className="badge-dot" aria-hidden="true" />{statusLabels[status]}</span>;
}

export function SourceBadge({ label = "Demo fixture · labeled" }: { label?: string }) {
  const isDemo = label.toLowerCase().includes("demo");
  return <span className={cn("source-badge", isDemo ? "source-demo" : "source-live")}><span className="source-dot" aria-hidden="true" />{label}</span>;
}

export function Confidence({ finding }: { finding: Finding }) {
  return <span className="confidence"><span className="confidence-bar" aria-hidden="true"><span style={{ width: `${finding.confidence * 100}%` }} /></span><span>{formatConfidence(finding.confidence)} confidence</span></span>;
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return <Button variant="ghost" size="sm" onClick={copy} aria-label={`${label}: ${value}`}><span className="button-icon" aria-hidden="true">{copied ? <Check size={14} /> : <Clipboard size={14} />}</span>{copied ? "Copied" : label}</Button>;
}

export function EmptyState({ icon = <Info size={20} />, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon" aria-hidden="true">{icon}</div><h2>{title}</h2><p>{description}</p>{action}</div>;
}

export function ErrorState({ title = "Report unavailable", description = "The report could not be loaded. Check the report JSON and try again." }: { title?: string; description?: string }) {
  return <div className="error-state" role="alert"><TriangleAlert size={18} aria-hidden="true" /><div><strong>{title}</strong><p>{description}</p></div></div>;
}

export function LoadingState({ label = "Loading report" }: { label?: string }) {
  return <div className="loading-state" role="status" aria-live="polite"><LoaderCircle className="spin" size={18} aria-hidden="true" />{label}…</div>;
}

export function FindingRow({ finding, onOpen }: { finding: Finding; onOpen: () => void }) {
  return <button className="finding-row" onClick={onOpen} aria-label={`Open finding ${finding.title}`}>
    <span className="finding-row-index" aria-hidden="true">↳</span>
    <div className="finding-row-body"><div className="finding-row-title"><SeverityBadge severity={finding.severity} /><strong>{finding.title}</strong></div><p>{finding.summary}</p><div className="finding-row-meta"><code>{finding.location.file}:{finding.location.line}</code><span className="finding-category">{finding.category}</span></div></div>
    <div className="finding-row-state"><StatusBadge status={finding.status} /><Confidence finding={finding} /><ExternalLink size={15} className="row-arrow" aria-hidden="true" /></div>
  </button>;
}

export function Kbd({ children }: { children: ReactNode }) { return <kbd>{children}</kbd>; }

export function InlineNotice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  return <div className={cn("inline-notice", `notice-${tone}`)}>{tone === "warning" ? <TriangleAlert size={15} aria-hidden="true" /> : <Info size={15} aria-hidden="true" />}<span>{children}</span></div>;
}

export function CloseButton({ onClick }: { onClick: () => void }) { return <IconButton label="Close" onClick={onClick}><X size={17} /></IconButton>; }
