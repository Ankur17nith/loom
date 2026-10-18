import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout.js";
import { demoReport } from "./data/demo-report.js";
import { FindingsPage, FindingDetailPage, GraphPage, OverviewPage, ReportsPage, SettingsPage, VerificationPage } from "./pages/dashboard-pages.js";
import { reportFromJson, type ReportLoadResult } from "./lib/report.js";
import { ErrorState, LoadingState } from "./components/ui.js";

const demoLoadedReport: ReportLoadResult = { ...reportFromJson(demoReport), source: "demo-fixture", label: "Demo fixture · labeled" };

export function App() {
  const [loadedReport, setLoadedReport] = useState<ReportLoadResult | undefined>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    const url = import.meta.env.VITE_LOOM_REPORT_URL;
    if (!url) { setLoadedReport(demoLoadedReport); return; }
    let cancelled = false;
    fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Report request failed with HTTP ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((input) => { if (!cancelled) setLoadedReport(reportFromJson(input)); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { cancelled = true; };
  }, []);
  if (error) return <BrowserRouter><div className="app-state"><ErrorState title="Report unavailable" description={error} /></div></BrowserRouter>;
  if (!loadedReport) return <BrowserRouter><div className="app-state"><LoadingState label="Loading Loom report" /></div></BrowserRouter>;
  const { report, label } = loadedReport;
  return <BrowserRouter><Routes><Route element={<AppLayout report={report} sourceLabel={label} />}><Route index element={<OverviewPage report={report} />} /><Route path="graph" element={<GraphPage report={report} />} /><Route path="findings" element={<FindingsPage report={report} />} /><Route path="findings/:findingId" element={<FindingDetailPage report={report} />} /><Route path="verification" element={<VerificationPage report={report} />} /><Route path="reports" element={<ReportsPage report={report} />} /><Route path="settings" element={<SettingsPage report={report} />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></BrowserRouter>;
}
