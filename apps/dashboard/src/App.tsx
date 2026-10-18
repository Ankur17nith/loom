import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout.js";
import { demoReport } from "./data/demo-report.js";
import { FindingsPage, FindingDetailPage, GraphPage, OverviewPage, ReportsPage, SettingsPage, VerificationPage } from "./pages/dashboard-pages.js";
import { reportFromJson } from "./lib/report.js";

const loadedReport = reportFromJson(demoReport);

export function App() {
  return <BrowserRouter><Routes><Route element={<AppLayout report={loadedReport.report} sourceLabel={loadedReport.label} />}><Route index element={<OverviewPage report={loadedReport.report} />} /><Route path="graph" element={<GraphPage report={loadedReport.report} />} /><Route path="findings" element={<FindingsPage report={loadedReport.report} />} /><Route path="findings/:findingId" element={<FindingDetailPage report={loadedReport.report} />} /><Route path="verification" element={<VerificationPage report={loadedReport.report} />} /><Route path="reports" element={<ReportsPage report={loadedReport.report} />} /><Route path="settings" element={<SettingsPage report={loadedReport.report} />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></BrowserRouter>;
}
