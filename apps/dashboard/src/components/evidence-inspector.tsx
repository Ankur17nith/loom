import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, ChevronRight, CircleAlert, Code2, GitBranch, ShieldAlert, Terminal, TriangleAlert } from "lucide-react";
import { Button, Confidence, CopyButton, Panel, SeverityBadge, StatusBadge, cn } from "./ui.js";
import { findingSummary, type Finding, type LoomReport } from "../lib/report.js";

function languageForPath(path?: string): string {
  if (!path) return "text";
  if (/\.tsx?$/.test(path)) return "typescript";
  if (/\.jsx?$/.test(path)) return "javascript";
  if (/\.json$/.test(path)) return "json";
  if (/\.css$/.test(path)) return "css";
  if (/\.ya?ml$/.test(path)) return "yaml";
  return "text";
}

export function FindingInspector({ report, finding, onOpenGraph }: { report: LoomReport; finding: Finding; onOpenGraph: () => void }) {
  const relatedFindings = report.findings.filter((candidate) => candidate.id !== finding.id && candidate.affectedNodeIds.some((id) => finding.affectedNodeIds.includes(id))).slice(0, 3);
  const affectedNodes = finding.affectedNodeIds.map((id) => report.nodes.find((node) => node.id === id)).filter((node): node is LoomReport["nodes"][number] => Boolean(node));
  const passedChecks = report.checks.filter((check) => check.status === "passed").length;
  const failingChecks = report.checks.filter((check) => check.status === "failed").length;
  const uncertain = finding.uncertainty.length > 0;

  return <aside className="inspector-pane" aria-label="Finding evidence inspector">
    <div className="inspector-header">
      <div><span className="section-kicker">Evidence inspector</span><span className="inspector-caption">Selected finding</span></div>
      <button className="icon-button" type="button" aria-label="Open finding in graph" title="Open finding in graph" onClick={onOpenGraph}><GitBranch size={17} /></button>
    </div>
    <div className="inspector-scroll">
      <div className="inspector-title-block">
        <div className="inspector-badges"><SeverityBadge severity={finding.severity} /><StatusBadge status={finding.status} /></div>
        <h2>{finding.title}</h2>
        <p>{findingSummary(finding)}</p>
      </div>

      <div className="inspector-facts">
        <div><span>Confidence</span><Confidence finding={finding} /></div>
        <div><span>Changed at</span><button className="source-link" type="button" onClick={onOpenGraph}><Code2 size={14} /><code>{finding.location.file}:{finding.location.line}</code><ArrowUpRight size={13} /></button></div>
        <div><span>Introduced in</span><code>{finding.introducedIn}</code></div>
      </div>

      {uncertain && <div className="inspector-alert alert-amber"><TriangleAlert size={16} /><div><strong>Uncertainty is part of this result</strong><ul>{finding.uncertainty.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}

      <section className="inspector-section">
        <SectionHeading eyebrow="Why it matters" title="Evidence chain" count={finding.evidence.length} />
        <div className="evidence-stack">{finding.evidence.map((item, index) => <EvidenceCard key={`${item.label}-${index}`} item={item} index={index} />)}</div>
      </section>

      <section className="inspector-section">
        <SectionHeading eyebrow="Dependency surface" title="Affected nodes" count={affectedNodes.length} />
        <div className="node-chip-list">{affectedNodes.map((node) => <button className="node-chip" type="button" key={node.id} onClick={onOpenGraph}><span className={cn("node-chip-dot", node.changed && "node-chip-dot-changed")} /><span><strong>{node.label}</strong><small>{node.path}</small></span><ChevronRight size={14} /></button>)}</div>
        <Button variant="secondary" size="sm" onClick={onOpenGraph}><GitBranch size={14} /> Trace this finding in the graph</Button>
      </section>

      <section className="inspector-section inspector-verification">
        <SectionHeading eyebrow="Artifact checks" title="Verification context" />
        {report.checks.length ? <div className="verification-inline"><span className={cn("verification-icon", failingChecks ? "verification-icon-failed" : passedChecks === report.checks.length ? "verification-icon-passed" : "verification-icon-partial")}>{failingChecks ? <CircleAlert size={16} /> : passedChecks === report.checks.length ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}</span><div><strong>{passedChecks}/{report.checks.length} checks passed</strong><p>{failingChecks ? `${failingChecks} check${failingChecks === 1 ? " is" : "s are"} failing.` : report.checks.some((check) => check.status === "inconclusive" || check.status === "skipped") ? "Some checks are incomplete or inconclusive." : "All attached checks passed."}</p></div></div> : <div className="verification-inline verification-inline-empty"><Terminal size={16} /><p>No checks are attached to this artifact.</p></div>}
      </section>

      {relatedFindings.length > 0 && <section className="inspector-section"><SectionHeading eyebrow="Same surface" title="Related findings" count={relatedFindings.length} /><div className="related-findings">{relatedFindings.map((related) => <div className="related-finding" key={related.id}><SeverityBadge severity={related.severity} /><span>{related.title}</span></div>)}</div></section>}

      <section className="inspector-action"><div><span className="section-kicker">Recommended next step</span><p>{finding.recommendedAction}</p></div><CopyButton value={finding.recommendedAction} label="Copy action" /></section>
    </div>
  </aside>;
}

function SectionHeading({ eyebrow, title, count }: { eyebrow: string; title: string; count?: number }) {
  return <div className="inspector-section-heading"><div><span className="section-kicker">{eyebrow}</span><h3>{title}</h3></div>{count !== undefined && <span className="section-count">{count}</span>}</div>;
}

function EvidenceCard({ item, index }: { item: Finding["evidence"][number]; index: number }) {
  const source = item.file ?? item.source.split(":")[0];
  const line = item.line ?? Number(item.source.match(/:(\d+)/)?.[1]);
  const code = item.code ?? item.value;
  return <article className="evidence-card">
    <div className="evidence-card-heading"><span className="evidence-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{item.label}</strong>{item.relation && <span className="relation-tag">{item.relation}</span>}</div><CopyButton value={`${item.source}${item.code ? `\n${item.code}` : ""}`} label="Copy evidence" /></div>
    <p className="evidence-value">{item.value}</p>
    {item.code && <SourceSnippet path={source} line={line} column={item.column} code={code} />}
    <div className="evidence-card-footer"><span><Code2 size={13} />{item.source}</span>{item.path && item.path.length > 1 && <EvidencePath path={item.path} />}</div>
  </article>;
}

function EvidencePath({ path }: { path: string[] }) {
  return <span className="evidence-path" aria-label={`Evidence path: ${path.join(" to ")}`}>{path.map((step, index) => <span className="evidence-path-step" key={`${step}-${index}`}><code>{step}</code>{index < path.length - 1 && <ChevronRight size={12} aria-hidden="true" />}</span>)}</span>;
}

function SourceSnippet({ path, line, column, code }: { path: string; line?: number; column?: number; code: string }) {
  const [highlighted, setHighlighted] = useState<string>();
  useEffect(() => {
    let active = true;
    void import("shiki").then(({ codeToHtml }) => codeToHtml(code, { lang: languageForPath(path), theme: "github-dark" })).then((html) => { if (active) setHighlighted(html); }).catch(() => undefined);
    return () => { active = false; };
  }, [code, path]);
  return <div className="source-snippet"><div className="source-snippet-header"><span><Code2 size={13} />{path}</span><span>line {line ?? "—"}{column ? `:${column}` : ""}</span></div><div className="source-snippet-body"><span className="source-line-number">{line ?? "·"}</span><div className="source-code">{highlighted ? <div dangerouslySetInnerHTML={{ __html: highlighted }} /> : <pre><code>{code}</code></pre>}</div></div></div>;
}
