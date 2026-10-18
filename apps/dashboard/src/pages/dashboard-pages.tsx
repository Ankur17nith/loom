import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleOff, Clock3, Code2, Download, FileCheck2, FileText, Filter, GitBranch, ListFilter, RefreshCw, Search, ShieldAlert, Terminal, TriangleAlert, X, XCircle } from "lucide-react";
import { DeferredGraphView } from "../components/deferred-graph.js";
import { FindingInspector } from "../components/evidence-inspector.js";
import { Button, CopyButton, EmptyState, ErrorState, FindingRow, InlineNotice, PageHeader, SeverityBadge, cn } from "../components/ui.js";
import { filterFindings, formatConfidence, formatReportDate, getFinding, getFindingGraphScope, reportStats, type Finding, type FindingSeverity, type FindingStatus, type LoomReport, type ProvenanceInfo } from "../lib/report.js";
import { useDashboardStore } from "../store/dashboard-store.js";

function downloadJson(value: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sortFindings(findings: LoomReport["findings"], sort: "risk" | "confidence" | "location") {
  return [...findings].sort((left, right) => {
    if (sort === "confidence") return right.confidence - left.confidence;
    if (sort === "location") return `${left.location.file}:${left.location.line}`.localeCompare(`${right.location.file}:${right.location.line}`);
    const severity = { critical: 4, high: 3, medium: 2, low: 1 };
    return severity[right.severity] - severity[left.severity] || right.confidence - left.confidence;
  });
}

export function OverviewPage({ report }: { report: LoomReport }) {
  const navigate = useNavigate();
  const stats = reportStats(report);
  const urgent = [...report.findings].sort((left, right) => {
    const severity = { critical: 4, high: 3, medium: 2, low: 1 };
    return severity[right.severity] - severity[left.severity] || right.confidence - left.confidence;
  });
  const primary = urgent[0];
  const checks = summarizeChecks(report);
  const isDemo = report.reportId.startsWith("demo-");

  return <div className="page-stack overview-page">
    <PageHeader eyebrow="Change review" title="Review the blast radius" description={`${report.repository.name} · ${report.repository.branch} · compared with ${report.repository.baseCommit.slice(0, 7)}`} actions={<><Button variant="secondary" onClick={() => navigate("/reports")}><FileText size={15} aria-hidden="true" /> Report artifact</Button><Button variant="primary" onClick={() => navigate(primary ? `/findings/${primary.id}` : "/findings")}>{primary ? "Review highest risk" : "Review findings"}<ArrowUpRight size={15} aria-hidden="true" /></Button></>} />
    {isDemo && <div className="source-strip"><CircleOff size={15} aria-hidden="true" /><span>Preview report</span><strong>Synthetic fixture</strong><span>·</span><span>Set <code>VITE_LOOM_REPORT_URL</code> to load a validated artifact.</span></div>}

    {/* Figma Hero Priority Break Card */}
    <section className="hero-break-card" aria-label="Priority review">
      <div className="hero-break-header">
        <div className="hero-break-tag">
          {primary ? (
            <>
              <ShieldAlert size={15} aria-hidden="true" />
              <span>PRIORITY CONTRACT BREAKAGE</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} aria-hidden="true" style={{ color: "var(--fl-proof)" }} />
              <span>NO BREAKAGE DETECTED</span>
            </>
          )}
        </div>
        <div className={cn("verification-gate-pill", stats.verification === "passing" ? "passing" : stats.verification === "failed" ? "failing" : "partial")}>
          {stats.verification === "passing" ? <CheckCircle2 size={13} aria-hidden="true" /> : <ShieldAlert size={13} aria-hidden="true" />}
          <span>Gate {verificationLabel(stats.verification).toLowerCase()}</span>
        </div>
      </div>
      <h2 className="hero-break-title">
        {primary ? primary.title : "All contract consumers are compatible"}
      </h2>
      <p className="hero-break-desc">
        {primary ? primary.summary : "No breaking contract changes or stale consumers were detected between the base commit and working tree."}
      </p>
      <div className="hero-break-meta">
        {primary && <>
          <span><strong>{primary.affectedNodeIds.length}</strong> affected consumers</span>
          <span><strong>{formatConfidence(primary.confidence)}</strong> confidence</span>
          <span>Rule: <code>{primary.category}</code></span>
          <span>Location: <code>{primary.location.file}:{primary.location.line}</code></span>
        </>}
        {!primary && <span>Clean baseline snapshot · {stats.filesChanged} file{stats.filesChanged === 1 ? "" : "s"} inspected</span>}
      </div>
      {primary && <div className="hero-actions" style={{ marginTop: 6 }}>
        <Button variant="primary" onClick={() => navigate(`/findings/${primary.id}`)}>
          <ShieldAlert size={15} aria-hidden="true" /> Open evidence
        </Button>
        <button className="quiet-link" type="button" onClick={() => navigate(`/graph?finding=${primary.id}`)}>
          <GitBranch size={14} aria-hidden="true" /> Trace in graph
        </button>
      </div>}
    </section>

    {/* Figma Metric Strip */}
    <section className="metric-strip" aria-label="Change surface numbers">
      <div className="metric-box">
        <span className="metric-label">Findings</span>
        <span className={cn("metric-val", stats.findings > 0 ? "text-red" : "text-green")}>{stats.findings}</span>
        <span className="metric-sub">{stats.highRisk} high-risk</span>
      </div>
      <div className="metric-box">
        <span className="metric-label">Affected Nodes</span>
        <span className="metric-val text-ember">{stats.affectedNodes}</span>
        <span className="metric-sub">{stats.filesChanged} file{stats.filesChanged === 1 ? "" : "s"} changed</span>
      </div>
      <div className="metric-box">
        <span className="metric-label">Verification Gate</span>
        <span className={cn("metric-val", stats.checksTotal === 0 ? "text-iris" : stats.verification === "passing" ? "text-green" : stats.verification === "failed" ? "text-red" : "text-iris")}>
          {stats.checksTotal ? `${Math.round((stats.checksPassed / stats.checksTotal) * 100)}%` : "Not run"}
        </span>
        <span className="metric-sub">{stats.checksTotal ? `${stats.checksPassed}/${stats.checksTotal} checks passed` : "0 checks recorded"}</span>
      </div>
      <div className="metric-box">
        <span className="metric-label">Confidence</span>
        <span className="metric-val text-iris">{stats.findings > 0 ? formatConfidence(averageConfidence(report)) : "100%"}</span>
        <span className="metric-sub">{stats.findings > 0 ? "Resolved compiler bindings" : "Deterministic graph check"}</span>
      </div>
    </section>

    {/* Figma 2-Column Overview Grid */}
    <div className="overview-grid">
      <section className="overview-panel" aria-label="Review queue">
        <div className="panel-head">
          <h2>Review Queue</h2>
          <span className="queue-badge">{stats.findings} unreviewed</span>
        </div>
        <div className="queue-list">
          {urgent.slice(0, 4).map((finding) => (
            <button
              className="queue-item"
              type="button"
              key={finding.id}
              onClick={() => navigate(`/findings/${finding.id}`)}
              aria-label={`Open finding ${finding.title}`}
            >
              <div className="queue-item-top">
                <span className={cn("tag", `tag-${finding.severity}`)}>{finding.severity}</span>
                <span className="queue-confidence">{formatConfidence(finding.confidence)}</span>
              </div>
              <h3 className="queue-item-title">{finding.title}</h3>
              <div className="queue-item-bottom">
                <code>{finding.location.file}:{finding.location.line}</code>
                <span>{finding.affectedNodeIds.length} consumers</span>
              </div>
            </button>
          ))}
          {urgent.length === 0 && (
            <div style={{ padding: 24 }}>
              <EmptyState icon={<CheckCircle2 size={20} />} title="Queue is clear" description="No findings are attached to this report." />
            </div>
          )}
        </div>
      </section>

      <section className="overview-panel" aria-label="Impact preview">
        <div className="panel-head">
          <h2>Impact Preview</h2>
          <button className="text-btn" type="button" onClick={() => navigate("/graph")}>
            Full graph <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="overview-graph-wrap" style={{ minHeight: 280, flex: 1 }}>
          <DeferredGraphView report={report} compact />
        </div>
      </section>
    </div>

    {/* Attached Verification */}
    <section className="verification-strip">
      <div>
        <span className="section-kicker">Attached verification</span>
        <strong>{verificationLabel(stats.verification)}</strong>
        <span>{stats.checksTotal ? `${stats.checksPassed} of ${stats.checksTotal} checks passed` : "No checks were recorded"}</span>
      </div>
      <Link className="button button-secondary button-sm button-as-link" to="/verification">
        Inspect checks <ChevronRight size={14} aria-hidden="true" />
      </Link>
    </section>
  </div>;
}

function Fact({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <div className="review-fact">
    <span className={cn("fact-mark", `fact-mark-${tone}`)} aria-hidden="true" />
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  </div>;
}

function ChangeLine({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) {
  return <div className="change-line">
    <span className="change-icon">{icon}</span>
    <div>
      <strong>{label}</strong>
      <small>{detail}</small>
    </div>
    <b>{value}</b>
  </div>;
}

function SectionHeading({ eyebrow, title, action, count }: { eyebrow: string; title: string; action?: React.ReactNode; count?: number }) {
  return <div className="section-heading">
    <div>
      <span className="section-kicker">{eyebrow}</span>
      <h2>{title}</h2>
    </div>
    {count !== undefined ? <span className="section-count">{count}</span> : action}
  </div>;
}

function averageConfidence(report: LoomReport) {
  return report.findings.length ? report.findings.reduce((total, finding) => total + finding.confidence, 0) / report.findings.length : 0;
}

function summarizeChecks(report: LoomReport) {
  return {
    passed: report.checks.filter((check) => check.status === "passed").length,
    failed: report.checks.filter((check) => check.status === "failed").length,
    incomplete: report.checks.filter((check) => check.status === "inconclusive" || check.status === "skipped" || check.status === "running").length,
  };
}

function verificationLabel(status: ReturnType<typeof reportStats>["verification"]) {
  return status === "passing" ? "Passing" : status === "failed" ? "Failed" : status === "partial" ? "Partial" : "Not run";
}

export function GraphPage({ report }: { report: LoomReport }) {
  const [searchParams] = useSearchParams();
  const findingIdParam = searchParams.get("finding") ?? undefined;
  const finding = getFinding(report, findingIdParam);
  const selectedNodeId = useDashboardStore((state) => state.selectedNodeId);
  const selectedNode = report.nodes.find((node) => node.id === selectedNodeId);
  const selectNode = useDashboardStore((state) => state.selectNode);
  const findingScope = finding ? getFindingGraphScope(report, finding) : undefined;
  const affected = finding?.affectedNodeIds.map((id) => report.nodes.find((node) => node.id === id)).filter((node): node is LoomReport["nodes"][number] => Boolean(node)) ?? [];

  return <div className="page-stack graph-page">
    <PageHeader eyebrow="Investigation workspace" title="Impact graph" description={finding ? `Tracing the evidence path for ${finding.title}` : "Move through changed symbols, consumers, and tests without losing the report context."} actions={<><Button variant="secondary" onClick={() => selectNode(undefined)}><RefreshCw size={15} aria-hidden="true" /> Reset view</Button><Button variant="primary" onClick={() => downloadJson({ nodes: report.nodes, edges: report.edges }, "loom-graph.json")}><Download size={15} aria-hidden="true" /> Export graph</Button></>} />
    {finding && <div className="context-strip">
      <span className="context-strip-dot" aria-hidden="true" />
      <strong>Finding scope</strong>
      <span>{findingScope?.nodeIds.size ?? affected.length} evidence-linked nodes</span>
      <Link to={`/findings/${finding.id}`}>Open finding <ArrowUpRight size={13} aria-hidden="true" /></Link>
    </div>}
    {findingIdParam && !finding && <div className="context-strip context-strip-warning" role="status" aria-label="Finding not found notice">
      <AlertTriangle size={14} aria-hidden="true" />
      <strong>Finding "{findingIdParam}" not found in current report</strong>
      <span>Displaying full dependency graph without finding filter.</span>
      <Link to="/findings">View all findings <ArrowUpRight size={13} aria-hidden="true" /></Link>
    </div>}
    <div className="graph-workspace">
      <section className="graph-stage">
        <DeferredGraphView report={report} focusNodeId={affected[0]?.id} scope={findingScope} />
      </section>
      <GraphInspector report={report} nodeId={selectedNode?.id} finding={finding} onClear={() => selectNode(undefined)} />
    </div>
  </div>;
}

function GraphInspector({ report, nodeId, finding, onClear }: { report: LoomReport; nodeId?: string; finding?: Finding; onClear: () => void }) {
  const node = report.nodes.find((item) => item.id === nodeId);
  const relatedFindings = node ? report.findings.filter((candidate) => candidate.affectedNodeIds.includes(node.id)) : [];
  const relationships = node ? report.edges.filter((edge) => edge.source === node.id || edge.target === node.id) : [];

  return <aside className="graph-inspector-pane" aria-label="Node inspector">
    <div className="graph-inspector-head">
      <div>
        <span className="section-kicker">Node inspector</span>
        <h2>{node ? node.label : finding ? "Evidence path" : "Choose a node"}</h2>
      </div>
      {node && <button className="icon-button" type="button" aria-label="Clear node selection" onClick={onClear}><X size={16} aria-hidden="true" /></button>}
    </div>
    {node ? <div className="graph-inspector-scroll">
      <div className="node-identity">
        <span className="node-kind-label">{node.kind}</span>
        <code>{node.path}</code>
        <span>{node.changed ? "Changed in this report" : "Context node"}</span>
      </div>
      <GraphSection title="Relationships" count={relationships.length}>
        {relationships.length ? relationships.map((edge) => {
          const otherId = edge.source === node.id ? edge.target : edge.source;
          const other = report.nodes.find((item) => item.id === otherId);
          return <div className="relationship-row" key={edge.id}>
            <span className="relationship-arrow" aria-hidden="true">{edge.source === node.id ? "→" : "←"}</span>
            <div>
              <strong>{other?.label ?? otherId}</strong>
              <span>{edge.kind}</span>
              <small>{edge.evidence}</small>
            </div>
          </div>;
        }) : <p className="muted-copy">No relationships are attached to this node.</p>}
      </GraphSection>
      {relatedFindings.length > 0 && <GraphSection title="Related findings" count={relatedFindings.length}>
        {relatedFindings.map((related) => <Link className="graph-related-finding" to={`/findings/${related.id}`} key={related.id}>
          <SeverityBadge severity={related.severity} />
          <span>{related.title}</span>
          <ChevronRight size={14} aria-hidden="true" />
        </Link>)}
      </GraphSection>}
    </div> : <div className="graph-empty">
      <GitBranch size={22} aria-hidden="true" />
      <h3>{finding ? "Select a node in the evidence path" : "Follow a dependency"}</h3>
      <p>{finding ? "The graph is scoped to the selected finding. Click a node to inspect relationships and related findings." : "Select a node to inspect its source location, relationships, and findings."}</p>
    </div>}
  </aside>;
}

function GraphSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return <section className="graph-inspector-section">
    <div className="graph-section-title">
      <h3>{title}</h3>
      <span>{count}</span>
    </div>
    {children}
  </section>;
}

export function FindingsPage({ report }: { report: LoomReport }) {
  return <FindingWorkspace report={report} />;
}

export function FindingDetailPage({ report }: { report: LoomReport }) {
  const { findingId } = useParams();
  if (!getFinding(report, findingId)) return <div className="page-stack">
    <PageHeader eyebrow="Evidence review" title="Finding not found" description="This finding is not present in the loaded report." />
    <ErrorState title="Finding unavailable" description="The link may refer to a different report version. Return to the findings list and choose a current finding." />
    <Link className="button button-secondary button-md button-as-link" to="/findings">
      <ArrowLeft size={15} aria-hidden="true" /> Back to findings
    </Link>
  </div>;
  return <FindingWorkspace report={report} selectedId={findingId} />;
}

function FindingWorkspace({ report, selectedId }: { report: LoomReport; selectedId?: string }) {
  const navigate = useNavigate();
  const query = useDashboardStore((state) => state.findingQuery);
  const severity = useDashboardStore((state) => state.severityFilter);
  const status = useDashboardStore((state) => state.statusFilter);
  const setQuery = useDashboardStore((state) => state.setFindingQuery);
  const setSeverity = useDashboardStore((state) => state.setSeverityFilter);
  const setStatus = useDashboardStore((state) => state.setStatusFilter);
  const selectedFindingId = useDashboardStore((state) => state.selectedFindingId);
  const selectFinding = useDashboardStore((state) => state.selectFinding);
  const [sort, setSort] = useState<"risk" | "confidence" | "location">("risk");
  const filteredFindings = useMemo(() => sortFindings(filterFindings(report.findings, { query, severity, status }), sort), [report.findings, query, severity, status, sort]);
  const activeId = selectedId ?? selectedFindingId ?? filteredFindings[0]?.id;
  const finding = activeId ? getFinding(report, activeId) : undefined;
  const openFinding = (id: string) => { selectFinding(id); navigate(`/findings/${id}`); };

  return <div className="page-stack findings-page">
    <PageHeader eyebrow="Evidence review" title="Findings" description="Start with what can break, then inspect the evidence that supports it." actions={<Button variant="secondary" onClick={() => downloadJson(filteredFindings, "loom-findings.json")}><Download size={15} aria-hidden="true" /> Export visible findings</Button>} />
    <div className="findings-workspace">
      <section className="finding-list-pane" aria-label="Finding queue">
        <div id="finding-queue-top" className="finding-list-toolbar">
          <div>
            <span className="section-kicker">Review queue</span>
            <strong>{filteredFindings.length} findings</strong>
          </div>
          <span className="toolbar-count">{report.findings.length} total</span>
        </div>
        <div className="finding-filters">
          <div className="search-field">
            <Search size={16} aria-hidden="true" />
            <label className="sr-only" htmlFor="finding-search">Search findings</label>
            <input id="finding-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, files, uncertainty…" />
            {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={15} aria-hidden="true" /></button>}
          </div>
          <div className="filter-line">
            <Filter size={14} aria-hidden="true" />
            <label htmlFor="severity-filter">Severity</label>
            <select id="severity-filter" value={severity} onChange={(event) => setSeverity(event.target.value as FindingSeverity | "all")}>
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <label htmlFor="status-filter">Status</label>
            <select id="status-filter" value={status} onChange={(event) => setStatus(event.target.value as FindingStatus | "all")}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
            <label htmlFor="sort-findings">Sort</label>
            <select id="sort-findings" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="risk">Risk first</option>
              <option value="confidence">Confidence</option>
              <option value="location">Location</option>
            </select>
          </div>
        </div>
        <div className="finding-list-meta">
          <span><ListFilter size={13} aria-hidden="true" />{query || severity !== "all" || status !== "all" ? "Filtered results" : "All report findings"}</span>
          <span>Severity · confidence</span>
        </div>
        <div className="finding-list">
          {filteredFindings.map((item) => <FindingRow key={item.id} finding={item} selected={item.id === finding?.id} onOpen={() => openFinding(item.id)} />)}
        </div>
        {filteredFindings.length === 0 && <EmptyState icon={<Search size={20} />} title="No findings match" description="Clear a filter or search for a different file, category, or uncertainty note." action={<Button variant="secondary" size="sm" onClick={() => { setQuery(""); setSeverity("all"); setStatus("all"); }}>Clear filters</Button>} />}
      </section>
      {finding ? <FindingInspector report={report} finding={finding} onOpenGraph={() => navigate(`/graph?finding=${finding.id}`)} /> : <aside className="inspector-pane inspector-empty"><EmptyState icon={<ShieldAlert size={22} />} title="Select a finding" description="Choose a finding from the review queue to inspect its evidence and affected surface." /></aside>}
    </div>
  </div>;
}

export function VerificationPage({ report }: { report: LoomReport }) {
  const stats = reportStats(report);
  const counts = {
    passed: report.checks.filter((check) => check.status === "passed").length,
    failed: report.checks.filter((check) => check.status === "failed").length,
    incomplete: report.checks.filter((check) => check.status === "inconclusive" || check.status === "skipped" || check.status === "running").length,
  };
  return <div className="page-stack verification-page">
    <PageHeader eyebrow="Artifact checks" title="Verification" description="Read-only results attached to this Loom report. The browser never executes repository commands." actions={<Button variant="secondary" disabled title="Checks must be approved and executed by the Loom CLI"><RefreshCw size={15} aria-hidden="true" /> Re-run checks</Button>} />
    <div className={cn("verification-gate", `verification-gate-${stats.verification}`)}>
      <div className="gate-symbol">
        {stats.verification === "passing" ? <CheckCircle2 size={22} aria-hidden="true" /> : stats.verification === "failed" ? <XCircle size={22} aria-hidden="true" /> : stats.verification === "partial" ? <TriangleAlert size={22} aria-hidden="true" /> : <CircleOff size={22} aria-hidden="true" />}
      </div>
      <div>
        <span className="section-kicker">Overall gate</span>
        <h2>{verificationLabel(stats.verification)}</h2>
        <p>{stats.checksTotal ? `${counts.passed} passed, ${counts.failed} failed, ${counts.incomplete} incomplete` : "No checks were recorded for this artifact."}</p>
      </div>
      <div className="gate-progress">
        <strong>{counts.passed}/{stats.checksTotal}</strong>
        <span>passed</span>
        <div role="progressbar" aria-valuenow={stats.checksTotal ? Math.round((counts.passed / stats.checksTotal) * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label="Checks passed progress">
          <i style={{ width: `${stats.checksTotal ? `${Math.round((counts.passed / stats.checksTotal) * 100)}%` : "0%"}` }} />
        </div>
      </div>
    </div>
    <section className="verification-counts" aria-label="Verification summary numbers">
      <VerificationCount label="Passed" value={counts.passed} tone="passed" icon={<Check size={16} aria-hidden="true" />} />
      <VerificationCount label="Failed" value={counts.failed} tone="failed" icon={<XCircle size={16} aria-hidden="true" />} />
      <VerificationCount label="Inconclusive" value={report.checks.filter((check) => check.status === "inconclusive").length} tone="inconclusive" icon={<TriangleAlert size={16} aria-hidden="true" />} />
      <VerificationCount label="Skipped / running" value={report.checks.filter((check) => check.status === "skipped" || check.status === "running").length} tone="skipped" icon={<Clock3 size={16} aria-hidden="true" />} />
    </section>
    {report.checks.length ? <section className="verification-list">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Captured output</span>
          <h2>Checks in this artifact</h2>
        </div>
        <span className="section-count">{report.checks.length}</span>
      </div>
      {report.checks.map((check) => <VerificationRow check={check} key={check.id} />)}
    </section> : <section className="section-block">
      <EmptyState icon={<FileCheck2 size={22} />} title="Verification not run" description="Run an approved check through the Loom CLI and attach the resulting report to see command output here." />
    </section>}
  </div>;
}

function VerificationCount({ label, value, tone, icon }: { label: string; value: number; tone: string; icon: React.ReactNode }) {
  return <div className={cn("verification-count", `verification-count-${tone}`)}>
    <span>{icon}</span>
    <strong>{value}</strong>
    <small>{label}</small>
  </div>;
}

function VerificationRow({ check }: { check: LoomReport["checks"][number] }) {
  const [open, setOpen] = useState(check.status === "failed" || check.status === "inconclusive");
  const icon = check.status === "passed" ? <Check size={17} aria-hidden="true" /> : check.status === "failed" ? <XCircle size={17} aria-hidden="true" /> : check.status === "inconclusive" ? <TriangleAlert size={17} aria-hidden="true" /> : <Clock3 size={17} aria-hidden="true" />;
  return <article className={cn("verification-row", `verification-row-${check.status}`)}>
    <div className="verification-row-status">{icon}</div>
    <div className="verification-row-main">
      <div className="verification-row-title">
        <div>
          <h3>{check.name}</h3>
          <code><Terminal size={13} aria-hidden="true" />{check.command}</code>
        </div>
        <StatusCheck status={check.status} />
      </div>
      <div className="verification-row-meta">
        <span>{check.durationMs !== undefined ? `${(check.durationMs / 1000).toFixed(1)}s` : "Duration unavailable"}</span>
        {check.reason && <span className="verification-reason">{check.reason}</span>}
        <button className="text-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? "Hide output" : "Show output"}
          <ChevronRight size={14} className={cn(open && "rotate-90")} aria-hidden="true" />
        </button>
      </div>
      {open && <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", background: "var(--surface-raised)", border: "1px solid var(--line)", borderBottom: 0, borderRadius: "6px 6px 0 0", marginTop: 12 }}>
          <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-3)" }}>Terminal Output</span>
          <CopyButton value={check.output ?? ""} label="Copy output" />
        </div>
        <pre className="verification-output" style={{ marginTop: 0, borderRadius: "0 0 6px 6px" }}><code>{check.output ?? "No output recorded"}</code></pre>
      </div>}
    </div>
  </article>;
}

function StatusCheck({ status }: { status: string }) {
  const label = status === "passed" ? "Passed" : status === "failed" ? "Failed" : status === "inconclusive" ? "Inconclusive" : status === "running" ? "Running" : "Skipped";
  return <span className={cn("check-status", `check-status-${status}`)}>{label}</span>;
}

export function ReportsPage({
  report,
  provenance,
  workspaceName = "loom",
}: {
  report: LoomReport;
  provenance?: ProvenanceInfo;
  workspaceName?: string;
}) {
  const stats = reportStats(report);
  const isForeign = Boolean(workspaceName && report.repository.name !== workspaceName && !report.reportId.startsWith("demo-"));
  const workingTreeState =
    report.repository.commit === report.repository.baseCommit
      ? report.summary.filesChanged > 0
        ? "Uncommitted changes"
        : "Clean baseline"
      : "Committed diff";

  return <div className="page-stack reports-page">
    <PageHeader eyebrow="Report artifact" title="Reports" description="The loaded report is the source of truth for this workspace. Historical storage comes from the host integration." actions={<Button variant="primary" onClick={() => downloadJson(report, `${report.repository.name}-loom-report.json`)}><Download size={15} aria-hidden="true" /> Download JSON</Button>} />
    <section className="artifact-header">
      <div className="artifact-icon"><FileCheck2 size={22} aria-hidden="true" /></div>
      <div>
        <span className="section-kicker">Current artifact</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h2>{report.reportId}</h2>
          <CopyButton value={report.reportId} label="Copy ID" />
        </div>
        <p>Validated as <code>{report.version}</code> · generated {formatReportDate(report.generatedAt)}</p>
      </div>
      <span className={cn("artifact-source", isForeign && "artifact-source-external")}>
        <span aria-hidden="true" />
        {isForeign ? `External: ${report.repository.name}` : report.reportId.startsWith("demo-") ? "Synthetic fixture" : "Imported report"}
      </span>
    </section>
    <div className="artifact-grid">
      <ArtifactFact label="Repository" value={report.repository.name} />
      <ArtifactFact label="Active workspace" value={workspaceName} />
      <ArtifactFact label="Source" value={provenance?.loadType === "dev-server" ? "Dev server (/reports/report.json)" : provenance?.loadType === "file-upload" ? `File (${provenance.location})` : provenance?.loadType === "remote-url" ? `URL (${provenance.location})` : (report.reportId.startsWith("demo-") ? "Demo fixture" : "Report artifact")} />
      <ArtifactFact label="Working tree" value={workingTreeState} />
      <ArtifactFact label="Branch" value={report.repository.branch} code />
      <ArtifactFact label="Commit" value={report.repository.commit.slice(0, 12)} code />
      <ArtifactFact label="Base" value={report.repository.baseCommit.slice(0, 12)} code />
      <ArtifactFact label="Report version" value={report.version} code />
    </div>
    <section className="section-block artifact-inventory">
      <SectionHeading eyebrow="Inventory" title="What this artifact contains" />
      <div className="inventory-table">
        <InventoryRow label="Changed files" value={stats.filesChanged} detail="Compared against base commit" />
        <InventoryRow label="Contract changes" value={stats.contractChanges} detail="Declarations with evidence" />
        <InventoryRow label="Findings" value={stats.findings} detail={`${stats.highRisk} high-risk findings`} />
        <InventoryRow label="Graph surface" value={report.nodes.length} detail={`${report.edges.length} directional relationships`} />
        <InventoryRow label="Verification" value={stats.checksTotal} detail={verificationLabel(stats.verification)} />
      </div>
    </section>
    <section className="report-links">
      <Link className="report-link" to="/findings">
        <ShieldAlert size={18} aria-hidden="true" />
        <span><strong>Review findings</strong><small>Open the evidence queue and inspector</small></span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
      <Link className="report-link" to="/graph">
        <GitBranch size={18} aria-hidden="true" />
        <span><strong>Trace impact graph</strong><small>Inspect changed and affected nodes</small></span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
      <Link className="report-link" to="/verification">
        <FileCheck2 size={18} aria-hidden="true" />
        <span><strong>Inspect verification</strong><small>Read attached commands and output</small></span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </section>
    <div className="history-empty">
      <Clock3 size={18} aria-hidden="true" />
      <div>
        <strong>No historical reports are loaded</strong>
        <p>Connect a host report provider to compare artifacts. This screen does not fabricate history.</p>
      </div>
    </div>
  </div>;
}

function ArtifactFact({ label, value, code = false }: { label: string; value: string; code?: boolean }) {
  return <div className="artifact-fact">
    <span>{label}</span>
    <strong className={cn(code && "mono-value")}>{value}</strong>
  </div>;
}

function InventoryRow({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="inventory-row">
    <strong>{label}</strong>
    <span>{detail}</span>
    <b>{value}</b>
  </div>;
}

export function SettingsPage({ report }: { report: LoomReport }) {
  return <div className="page-stack settings-page">
    <PageHeader eyebrow="Workspace configuration" title="Settings" description="Configuration the dashboard can accurately describe." />
    <section className="settings-list">
      <SettingRow label="Report source" detail="The UI loads VITE_LOOM_REPORT_URL when configured, otherwise it uses the labeled fixture." value={report.reportId.startsWith("demo-") ? "Synthetic fixture" : "Imported report"} />
      <SettingRow label="Verification execution" detail="Checks are approved and executed by the Loom CLI, never by this browser session." value="CLI only" />
      <SettingRow label="Schema validation" detail="The loaded JSON is validated before it is rendered." value={report.version} code />
      <SettingRow label="Persistence" detail="Historical reports, authentication, and provider storage are supplied by the host integration." value="Not configured" />
    </section>
    <InlineNotice>{"Settings are read-only in this release. The dashboard shows report facts; it does not silently change repository or provider state."}</InlineNotice>
  </div>;
}

function SettingRow({ label, detail, value, code = false }: { label: string; detail: string; value: string; code?: boolean }) {
  return <div className="setting-row">
    <div>
      <strong>{label}</strong>
      <p>{detail}</p>
    </div>
    <span className={cn("setting-value", code && "mono-value")}>{value}</span>
  </div>;
}
