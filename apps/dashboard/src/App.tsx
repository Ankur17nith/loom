import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout.js";
import { demoReport } from "./data/demo-report.js";
import { FindingsPage, FindingDetailPage, GraphPage, OverviewPage, ReportsPage, SettingsPage, VerificationPage } from "./pages/dashboard-pages.js";
import { BrandShowcasePage } from "./pages/brand-page.js";
import { reportFromJson, type LoomReport, type ReportLoadResult } from "./lib/report.js";
import { LoadingState } from "./components/ui.js";
import { ReportConnectScreen } from "./components/report-connect.js";
import { useDashboardStore } from "./store/dashboard-store.js";

const demoLoadedReport: ReportLoadResult = { ...reportFromJson(demoReport), source: "demo-fixture", label: "Demo fixture · labeled" };

function resetDashboardState() {
  useDashboardStore.setState({
    selectedFindingId: undefined,
    selectedNodeId: undefined,
    findingQuery: "",
    severityFilter: "all",
    statusFilter: "all",
  });
}

function isReportStale(report: LoomReport): boolean {
  try {
    const ageMs = Date.now() - new Date(report.generatedAt).getTime();
    return ageMs > 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function App() {
  const [loadedReport, setLoadedReport] = useState<ReportLoadResult | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  const loadFromUrl = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(undefined);

    // Detect attempts to pass local filesystem paths directly to browser fetch
    if (
      trimmed.startsWith("file://") ||
      trimmed.startsWith("./") ||
      trimmed.startsWith("../") ||
      trimmed.startsWith("~/") ||
      /^[a-zA-Z]:[\\/]/.test(trimmed) ||
      (trimmed.startsWith("/") && !trimmed.startsWith("/reports/"))
    ) {
      setError(
        `Local filesystem paths ("${trimmed}") cannot be read directly by browser HTTP requests. Use the drag-and-drop dropzone or "Select from disk" above, or use the dev server endpoint /reports/report.json.`
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(trimmed);
      if (!response.ok) {
        throw new Error(`Report request failed with HTTP ${response.status} (${response.statusText || "Not Found"}) for ${trimmed}`);
      }
      const rawText = await response.text();
      if (!rawText.trim()) {
        throw new Error("The report at this URL is empty. Please run 'loom scan --output <path>' to generate valid report content.");
      }
      let input: unknown;
      try {
        input = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(`Malformed JSON in report: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
      }
      const adapted = reportFromJson(input);
      resetDashboardState();
      setLoadedReport({ ...adapted, label: `URL: ${trimmed}` });
      try { sessionStorage.removeItem("loom_demo_mode"); } catch {}
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  };

  const handleFileLoaded = (content: string, filename: string) => {
    setError(undefined);
    if (!content.trim()) {
      setError(`Report file "${filename}" is empty. Please run 'loom scan --output ${filename}' to produce a valid report.`);
      return;
    }
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (parseErr) {
        throw new Error(`Malformed JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
      }
      const adapted = reportFromJson(parsed);
      resetDashboardState();
      setLoadedReport({ ...adapted, label: `File: ${filename}` });
      try { sessionStorage.removeItem("loom_demo_mode"); } catch {}
    } catch (reason: unknown) {
      setError(`Invalid report in ${filename}: ${reason instanceof Error ? reason.message : String(reason)}`);
    }
  };

  const handleDemoClick = () => {
    setError(undefined);
    resetDashboardState();
    try { sessionStorage.setItem("loom_demo_mode", "true"); } catch {}
    setLoadedReport(demoLoadedReport);
  };

  const handleUnloadReport = () => {
    try { sessionStorage.removeItem("loom_demo_mode"); } catch {}
    resetDashboardState();
    setLoadedReport(undefined);
    setError(undefined);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get("demo");
    const isExplicitDemo = demoParam === "true" || demoParam === "1" || params.has("demo");
    const reportParam = params.get("report") ?? params.get("reportUrl");
    const envUrl = import.meta.env.VITE_LOOM_REPORT_URL;
    const envDemo = import.meta.env.VITE_LOOM_DEMO === "true";
    let sessionDemo = false;
    try { sessionDemo = sessionStorage.getItem("loom_demo_mode") === "true"; } catch {}

    if (isExplicitDemo || envDemo || sessionDemo) {
      setLoadedReport(demoLoadedReport);
      return;
    }

    const targetUrl = reportParam || envUrl;
    if (targetUrl) {
      void loadFromUrl(targetUrl);
    }
  }, []);

  if (!loadedReport) {
    if (loading) {
      return (
        <BrowserRouter>
          <div className="app-state">
            <LoadingState label="Loading Loom report…" />
          </div>
        </BrowserRouter>
      );
    }
    return (
      <ReportConnectScreen
        onFileLoaded={handleFileLoaded}
        onUrlSubmit={loadFromUrl}
        onDemoClick={handleDemoClick}
        error={error}
        loading={loading}
      />
    );
  }

  const { report, label, source } = loadedReport;
  const isDemo = source === "demo-fixture";
  const stale = isReportStale(report);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AppLayout
              report={report}
              sourceLabel={label}
              isDemo={isDemo}
              isStale={stale}
              onUnloadReport={handleUnloadReport}
              onLoadFile={(file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  if (typeof e.target?.result === "string") {
                    handleFileLoaded(e.target.result, file.name);
                  }
                };
                reader.readAsText(file);
              }}
            />
          }
        >
          <Route index element={<OverviewPage report={report} />} />
          <Route path="graph" element={<GraphPage report={report} />} />
          <Route path="findings" element={<FindingsPage report={report} />} />
          <Route path="findings/:findingId" element={<FindingDetailPage report={report} />} />
          <Route path="verification" element={<VerificationPage report={report} />} />
          <Route path="reports" element={<ReportsPage report={report} />} />
          <Route path="settings" element={<SettingsPage report={report} />} />
          <Route path="brand" element={<BrandShowcasePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
