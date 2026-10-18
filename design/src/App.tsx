import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Code2,
  ExternalLink,
  FileCheck2,
  FileCode2,
  FileText,
  Filter,
  GitBranch,
  GitCommit,
  Info,
  Layers,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "findings" | "graph" | "verification" | "reports" | "settings">("overview");
  const [selectedFindingId, setSelectedFindingId] = useState<string>("finding-1");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const findings = [
    {
      id: "finding-1",
      severity: "critical",
      title: "Removed billingAddress field from CheckoutPayload contract",
      module: "src/contracts/checkout.ts",
      consumerCount: 4,
      confidence: 0.98,
      rule: "removed-contract-field",
      file: "src/services/payment-gateway.ts",
      line: 42,
      col: 18,
      codeSnippet: `export async function processPayment(payload: CheckoutPayload) {\n  const address = payload.billingAddress; // BREAK: Property billingAddress does not exist\n  return gateway.charge({ amount: payload.total, address });\n}`,
      affectedSymbol: "billingAddress",
      tracePath: ["CheckoutPayload", "PaymentService", "payment-gateway.ts", "checkout-flow.tsx"],
      mitigation: "Restore billingAddress or migrate downstream consumers to use billingProfile.address.",
    },
    {
      id: "finding-2",
      severity: "high",
      title: "Added required taxIdentifier field to CustomerAccount",
      module: "src/contracts/customer.ts",
      consumerCount: 2,
      confidence: 0.92,
      rule: "added-required-field",
      file: "src/components/account-form.tsx",
      line: 88,
      col: 12,
      codeSnippet: `const newAccount: CustomerAccount = {\n  id: generateId(),\n  name: formData.name,\n  // ERROR: Property taxIdentifier is missing\n};`,
      affectedSymbol: "taxIdentifier",
      tracePath: ["CustomerAccount", "AccountService", "account-form.tsx"],
      mitigation: "Make taxIdentifier optional (taxIdentifier?: string) or provide default fallback in account creators.",
    },
    {
      id: "finding-3",
      severity: "medium",
      title: "Field renamed: customerDiscount -> promotionalDiscount",
      module: "src/contracts/pricing.ts",
      consumerCount: 3,
      confidence: 0.85,
      rule: "renamed-contract-field",
      file: "src/lib/discounts.ts",
      line: 15,
      col: 22,
      codeSnippet: `export function applyDiscount(price: number, discount: DiscountRule) {\n  return price - (discount.customerDiscount ?? 0);\n}`,
      affectedSymbol: "customerDiscount",
      tracePath: ["DiscountRule", "PricingEngine", "discounts.ts"],
      mitigation: "Add deprecated alias for customerDiscount or update discounts.ts to promotionalDiscount.",
    },
  ];

  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== "all" && f.severity !== severityFilter) return false;
    if (searchQuery && !f.title.toLowerCase().includes(searchQuery.toLowerCase()) && !f.module.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedFinding = findings.find((f) => f.id === selectedFindingId) ?? findings[0];

  return (
    <div className="app-frame">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M4 6h6v4H4z" fill="currentColor" opacity="0.9" />
              <path d="M14 6h6v4h-6z" fill="currentColor" opacity="0.9" />
              <path d="M4 14h6v4H4z" fill="currentColor" opacity="0.9" />
              <path d="M14 14h6v4h-6z" fill="currentColor" opacity="0.9" />
              <path d="M13.2 3.5L10.8 20.5" stroke="var(--fl-ember)" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="brand-name">Loom</span>
          <span className="brand-version">v0.1.0</span>
        </div>

        <div className="sidebar-repo">
          <span className="repo-pulse" />
          <div>
            <strong>acme-commerce</strong>
            <code>feat/checkout-v2</code>
          </div>
        </div>

        <nav className="main-nav" aria-label="Primary navigation">
          <span className="nav-section-label">Review</span>
          <button
            type="button"
            className={`nav-link ${activeTab === "overview" ? "nav-link-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 size={16} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === "findings" ? "nav-link-active" : ""}`}
            onClick={() => setActiveTab("findings")}
          >
            <ShieldCheck size={16} />
            <span>Findings</span>
            <span className="nav-count">{findings.length}</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === "graph" ? "nav-link-active" : ""}`}
            onClick={() => setActiveTab("graph")}
          >
            <GitBranch size={16} />
            <span>Impact graph</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === "verification" ? "nav-link-active" : ""}`}
            onClick={() => setActiveTab("verification")}
          >
            <FileCheck2 size={16} />
            <span>Verification</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === "reports" ? "nav-link-active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <FileText size={16} />
            <span>Reports</span>
          </button>

          <span className="nav-section-label nav-section-spaced">Workspace</span>
          <button
            type="button"
            className={`nav-link ${activeTab === "settings" ? "nav-link-active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="source-badge source-live">
            <span className="source-dot" />
            <span>Loom engine report</span>
          </div>
          <div className="sidebar-status">
            <span className="status-pip status-pip-passing" />
            <span>Verification passing</span>
          </div>
        </div>
      </aside>

      {/* Content Frame */}
      <div className="content-frame">
        <header className="topbar">
          <div className="topbar-title">
            <span>acme-commerce</span>
            <span className="topbar-slash">/</span>
            <strong>
              {activeTab === "overview" && "Overview"}
              {activeTab === "findings" && "Findings"}
              {activeTab === "graph" && "Impact graph"}
              {activeTab === "verification" && "Verification"}
              {activeTab === "reports" && "Reports"}
              {activeTab === "settings" && "Settings"}
            </strong>
          </div>
          <div className="review-context">
            <span>
              <span className="context-dot" />feat/checkout-v2
            </span>
            <span>base <code>a1b2c3d</code></span>
            <span>commit <code>e4f5a6b</code></span>
          </div>
          <div className="topbar-actions">
            <div className="source-badge source-live">
              <span className="source-dot" />
              <span>Engine v0.1.0</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          {/* OVERVIEW SCREEN */}
          {activeTab === "overview" && (
            <div className="overview-cockpit">
              {/* Hero Priority Break Card */}
              <div className="hero-break-card">
                <div className="hero-break-header">
                  <div className="hero-break-tag">
                    <ShieldAlert size={15} />
                    <span>PRIORITY CONTRACT BREAKAGE</span>
                  </div>
                  <div className="verification-gate-pill passing">
                    <CheckCircle2 size={13} />
                    <span>Gate passing</span>
                  </div>
                </div>
                <h1 className="hero-break-title">
                  Removed <code>billingAddress</code> from <code>CheckoutPayload</code> breaks payment processing
                </h1>
                <p className="hero-break-desc">
                  Working tree modification in <code>src/contracts/checkout.ts</code> removes the field while 4 downstream modules actively access it in payment pipelines.
                </p>
                <div className="hero-break-meta">
                  <span><strong>4</strong> affected consumers</span>
                  <span><strong>98%</strong> confidence</span>
                  <span>Rule: <code>removed-contract-field</code></span>
                </div>
              </div>

              {/* Metric Row */}
              <div className="metric-strip">
                <div className="metric-box">
                  <span className="metric-label">Findings</span>
                  <span className="metric-val text-red">3</span>
                  <span className="metric-sub">1 critical, 1 high, 1 med</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Affected Modules</span>
                  <span className="metric-val text-ember">9</span>
                  <span className="metric-sub">across 4 workspaces</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Verification Gate</span>
                  <span className="metric-val text-green">100%</span>
                  <span className="metric-sub">4/4 tests executed</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Confidence</span>
                  <span className="metric-val text-iris">High</span>
                  <span className="metric-sub">Resolved compiler bindings</span>
                </div>
              </div>

              {/* Review Queue & Graph Grid */}
              <div className="overview-grid">
                <div className="overview-panel">
                  <div className="panel-head">
                    <h2>Review Queue</h2>
                    <span className="queue-badge">3 unreviewed</span>
                  </div>
                  <div className="queue-list">
                    {findings.map((f) => (
                      <div
                        key={f.id}
                        className="queue-item"
                        onClick={() => {
                          setSelectedFindingId(f.id);
                          setActiveTab("findings");
                        }}
                      >
                        <div className="queue-item-top">
                          <span className={`tag tag-${f.severity}`}>{f.severity}</span>
                          <span className="queue-confidence">{Math.round(f.confidence * 100)}% conf</span>
                        </div>
                        <h3 className="queue-item-title">{f.title}</h3>
                        <div className="queue-item-bottom">
                          <code>{f.module}</code>
                          <span>{f.consumerCount} consumers</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overview-panel">
                  <div className="panel-head">
                    <h2>Impact Preview</h2>
                    <button className="text-btn" onClick={() => setActiveTab("graph")}>
                      Full graph <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="graph-preview-canvas">
                    <div className="preview-node source-node">
                      <FileCode2 size={15} />
                      <div>
                        <strong>checkout.ts</strong>
                        <span>Modified Contract</span>
                      </div>
                    </div>
                    <div className="preview-edge" />
                    <div className="preview-node break-node">
                      <ShieldAlert size={15} />
                      <div>
                        <strong>payment-gateway.ts</strong>
                        <span>Broken Access (Line 42)</span>
                      </div>
                    </div>
                    <div className="preview-edge" />
                    <div className="preview-node consumer-node">
                      <Layers size={15} />
                      <div>
                        <strong>checkout-flow.tsx</strong>
                        <span>Downstream UI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINDINGS SCREEN */}
          {activeTab === "findings" && (
            <div className="findings-workspace">
              {/* Finding Queue Column */}
              <div className="findings-queue-pane">
                <div className="filter-bar">
                  <div className="search-input-wrap">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Filter findings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="filter-select-wrap">
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                    >
                      <option value="all">All severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                </div>

                <div className="findings-list">
                  {filteredFindings.map((f) => (
                    <div
                      key={f.id}
                      className={`finding-card ${selectedFindingId === f.id ? "finding-card-active" : ""}`}
                      onClick={() => setSelectedFindingId(f.id)}
                    >
                      <div className="finding-card-top">
                        <span className={`tag tag-${f.severity}`}>{f.severity}</span>
                        <span className="finding-card-rule">{f.rule}</span>
                        <span className="finding-card-conf">{Math.round(f.confidence * 100)}%</span>
                      </div>
                      <h3 className="finding-card-title">{f.title}</h3>
                      <div className="finding-card-sub">
                        <code>{f.file}:{f.line}</code>
                        <span>{f.consumerCount} consumers</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Persistent Evidence Inspector */}
              <div className="evidence-inspector-pane">
                <div className="inspector-head">
                  <div className="inspector-head-top">
                    <span className={`tag tag-${selectedFinding.severity}`}>{selectedFinding.severity}</span>
                    <span className="inspector-rule">{selectedFinding.rule}</span>
                    <span className="inspector-confidence">{Math.round(selectedFinding.confidence * 100)}% confidence</span>
                  </div>
                  <h2 className="inspector-title">{selectedFinding.title}</h2>
                  <div className="inspector-location">
                    <span>Source: <code>{selectedFinding.module}</code></span>
                    <span>Consumer: <code>{selectedFinding.file}:{selectedFinding.line}:{selectedFinding.col}</code></span>
                  </div>
                </div>

                <div className="inspector-section">
                  <h3 className="section-title">
                    <Code2 size={14} />
                    <span>Evidence Code Context</span>
                  </h3>
                  <div className="code-viewer">
                    <div className="code-viewer-header">
                      <span>{selectedFinding.file}</span>
                      <span>TypeScript</span>
                    </div>
                    <pre className="code-viewer-pre">
                      <code>{selectedFinding.codeSnippet}</code>
                    </pre>
                  </div>
                </div>

                <div className="inspector-section">
                  <h3 className="section-title">
                    <GitBranch size={14} />
                    <span>Dependency Trace Path</span>
                  </h3>
                  <div className="trace-path-flow">
                    {selectedFinding.tracePath.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <div className="trace-step">
                          <code>{step}</code>
                        </div>
                        {idx < selectedFinding.tracePath.length - 1 && (
                          <ChevronRight size={13} className="trace-arrow" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="inspector-section">
                  <h3 className="section-title">
                    <Info size={14} />
                    <span>Suggested Mitigation</span>
                  </h3>
                  <div className="mitigation-box">
                    <p>{selectedFinding.mitigation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GRAPH SCREEN */}
          {activeTab === "graph" && (
            <div className="graph-workspace-view">
              <div className="graph-canvas-container">
                <div className="graph-canvas-placeholder">
                  <div className="graph-mock-center">
                    <div className="graph-cluster">
                      <div className="graph-node-bubble source">
                        <strong>checkout.ts</strong>
                        <span>Contract Root</span>
                      </div>
                      <div className="graph-edge-connector" />
                      <div className="graph-node-bubble impact">
                        <strong>payment-gateway.ts</strong>
                        <span>Critical Impact</span>
                      </div>
                      <div className="graph-edge-connector" />
                      <div className="graph-node-bubble consumer">
                        <strong>checkout-flow.tsx</strong>
                        <span>Consumer UI</span>
                      </div>
                    </div>
                    <p className="graph-hint">Interactive ReactFlow graph active in main dashboard at /graph</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VERIFICATION SCREEN */}
          {activeTab === "verification" && (
            <div className="verification-screen">
              <div className="verification-head">
                <div>
                  <h2>Attached Verification Checks</h2>
                  <p>Read-only check outcomes attached to Loom report v0.1.0</p>
                </div>
                <div className="verification-badge-large passing">
                  <CheckCircle2 size={16} />
                  <span>All Checks Passing (4/4)</span>
                </div>
              </div>

              <div className="checks-list">
                <div className="check-card check-passed">
                  <div className="check-card-left">
                    <CheckCircle2 size={16} className="text-green" />
                    <div>
                      <strong>TypeScript Typecheck</strong>
                      <code>npm run typecheck</code>
                    </div>
                  </div>
                  <span className="check-timing">240ms</span>
                </div>
                <div className="check-card check-passed">
                  <div className="check-card-left">
                    <CheckCircle2 size={16} className="text-green" />
                    <div>
                      <strong>Unit & Contract Tests</strong>
                      <code>npm run test:contracts</code>
                    </div>
                  </div>
                  <span className="check-timing">680ms</span>
                </div>
                <div className="check-card check-passed">
                  <div className="check-card-left">
                    <CheckCircle2 size={16} className="text-green" />
                    <div>
                      <strong>Lint & Static Analysis</strong>
                      <code>npm run lint</code>
                    </div>
                  </div>
                  <span className="check-timing">420ms</span>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS SCREEN */}
          {activeTab === "reports" && (
            <div className="reports-screen">
              <div className="reports-head">
                <h2>Loom Report Artifacts</h2>
                <p>Validated report schema: <code>loom.report/v1</code></p>
              </div>
              <div className="report-card">
                <div className="report-card-meta">
                  <strong>demo-checkout-2026-10-18.json</strong>
                  <span>Generated: 2026-10-18T12:00:00Z</span>
                  <span>Commit: <code>e4f5a6b</code></span>
                </div>
                <div className="report-card-actions">
                  <button className="action-btn">Download JSON</button>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS SCREEN */}
          {activeTab === "settings" && (
            <div className="settings-screen">
              <div className="settings-head">
                <h2>Analysis Configuration</h2>
                <p>Local configuration loaded from <code>.loom/config.json</code></p>
              </div>
              <div className="settings-form">
                <div className="settings-field">
                  <label>Base Ref</label>
                  <input type="text" defaultValue="HEAD~1" readOnly />
                </div>
                <div className="settings-field">
                  <label>Confidence Threshold</label>
                  <input type="text" defaultValue="0.75" readOnly />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export default App;
