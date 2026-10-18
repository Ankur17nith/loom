import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { demoReport } from "../data/demo-report.js";
import { FindingsPage, FindingDetailPage, OverviewPage, VerificationPage, SettingsPage } from "../pages/dashboard-pages.js";
import { AppLayout } from "./layout.js";
import { LoomSymbol, LoomLogo, LoomAppIcon } from "./brand/loom-brand.js";
import { useDashboardStore } from "../store/dashboard-store.js";

function resetStore() {
  useDashboardStore.setState({ findingQuery: "", severityFilter: "all", statusFilter: "all", selectedFindingId: undefined, selectedNodeId: undefined, commandPaletteOpen: false, sidebarOpen: false });
}

describe("dashboard components", () => {
  it("filters findings in the real findings view", () => {
    resetStore();
    render(<MemoryRouter initialEntries={["/findings"]}><FindingsPage report={demoReport} /></MemoryRouter>);
    const queue = screen.getByRole("region", { name: "Finding queue" });
    expect(within(queue).getByText("Payment status contract changed")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Severity"), { target: { value: "critical" } });
    expect(within(queue).getByText("Retry can duplicate an order")).toBeInTheDocument();
    expect(within(queue).queryByText("Payment status contract changed")).not.toBeInTheDocument();
  });

  it("shows the empty state when filters have no match", () => {
    resetStore();
    render(<MemoryRouter><FindingsPage report={demoReport} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Search findings"), { target: { value: "no such finding" } });
    expect(screen.getByText("No findings match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("renders an error state for a finding missing from the loaded report", () => {
    render(<MemoryRouter initialEntries={["/findings/missing"]}><Routes><Route path="/findings/:findingId" element={<FindingDetailPage report={demoReport} />} /></Routes></MemoryRouter>);
    expect(screen.getByText("Finding unavailable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to findings/ })).toHaveAttribute("href", "/findings");
  });

  it("keeps evidence paths visible in finding details", () => {
    render(<MemoryRouter initialEntries={["/findings/finding-payment-status"]}><Routes><Route path="/findings/:findingId" element={<FindingDetailPage report={demoReport} />} /></Routes></MemoryRouter>);
    expect(screen.getAllByLabelText("Evidence path: src/pages/CheckoutPage.tsx to src/contracts/payment.ts")).toHaveLength(2);
    expect(screen.queryByText("Limits noted")).not.toBeInTheDocument();
  });

  it("opens the command palette and navigates from a command", () => {
    resetStore();
    render(<MemoryRouter initialEntries={["/"]}><Routes><Route element={<AppLayout report={demoReport} />}><Route index element={<div>Overview route</div>} /><Route path="/graph" element={<div>Graph route</div>} /></Route></Routes></MemoryRouter>);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Command menu" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Trace impact graph/ }));
    expect(screen.getByText("Graph route")).toBeInTheDocument();
  });

  it("selects and navigates to a finding from the findings list", () => {
    resetStore();
    render(<MemoryRouter initialEntries={["/findings"]}><Routes><Route path="/findings" element={<FindingsPage report={demoReport} />} /><Route path="/findings/:findingId" element={<div>Finding details route</div>} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Open finding Payment status contract changed/ }));
    expect(screen.getByText("Finding details route")).toBeInTheDocument();
  });

  it("renders the Figma priority break hero card and metric strip in Overview", () => {
    resetStore();
    render(<MemoryRouter initialEntries={["/"]}><OverviewPage report={demoReport} /></MemoryRouter>);
    expect(screen.getByText("PRIORITY CONTRACT BREAKAGE")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Priority review" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Change surface numbers" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Review queue" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Impact preview" })).toBeInTheDocument();
  });

  it("renders verification gate and check output in Verification", () => {
    render(<MemoryRouter initialEntries={["/verification"]}><VerificationPage report={demoReport} /></MemoryRouter>);
    expect(screen.getByText("Overall gate")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders workspace settings in Settings", () => {
    render(<MemoryRouter initialEntries={["/settings"]}><SettingsPage report={demoReport} /></MemoryRouter>);
    expect(screen.getByText("Report source")).toBeInTheDocument();
    expect(screen.getByText("Schema validation")).toBeInTheDocument();
  });

  it("renders canonical Loom brand components with geometric L and cool blue accent", () => {
    const { container: symbolDark } = render(<LoomSymbol size={32} title="Loom Dark Symbol" />);
    expect(symbolDark.querySelector("title")?.textContent).toBe("Loom Dark Symbol");
    // Verify cool blue accent fill
    expect(symbolDark.querySelector('path[fill="#889CFF"]')).toBeInTheDocument();

    const { container: symbolLight } = render(<LoomSymbol size={32} surface="light" title="Loom Light Symbol" />);
    expect(symbolLight.querySelector('path[fill="#4F46E5"]')).toBeInTheDocument();

    const { container: appIcon } = render(<LoomAppIcon size={48} />);
    expect(appIcon.querySelector('rect[rx="14"]')).toBeInTheDocument();

    render(<LoomLogo height={28} />);
    expect(screen.getByText("Loom")).toBeInTheDocument();
  });

  it("renders canonical brand mark inside AppLayout sidebar", () => {
    resetStore();
    const { container } = render(<MemoryRouter><AppLayout report={demoReport} /></MemoryRouter>);
    const brandMark = container.querySelector(".sidebar-brand .brand-mark");
    expect(brandMark).toBeInTheDocument();
    expect(brandMark?.querySelector('path[fill="#889CFF"]')).toBeInTheDocument();
  });

  it("renders clean state when report has 0 findings and 0 checks", () => {
    resetStore();
    const cleanReport = {
      ...demoReport,
      reportId: "clean-report-1",
      summary: { filesChanged: 0, findings: 0, highRisk: 0, verification: "not-run" as const },
      contractChanges: [],
      findings: [],
      checks: [],
    };
    render(<MemoryRouter initialEntries={["/"]}><OverviewPage report={cleanReport} /></MemoryRouter>);
    expect(screen.getByText("NO BREAKAGE DETECTED")).toBeInTheDocument();
    expect(screen.getByText("All contract consumers are compatible")).toBeInTheDocument();
    expect(screen.getByText("0 checks recorded")).toBeInTheDocument();
    expect(screen.getByText("Queue is clear")).toBeInTheDocument();
  });

  it("renders demo mode banner when isDemo is true and allows exiting", () => {
    resetStore();
    let exited = false;
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppLayout
          report={demoReport}
          sourceLabel="Demo fixture · labeled"
          isDemo={true}
          onUnloadReport={() => { exited = true; }}
        />
      </MemoryRouter>
    );
    expect(screen.getByLabelText("Demo mode notice")).toBeInTheDocument();
    expect(screen.getByText(/Viewing synthetic contract-breakage fixture/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Exit demo \/ Load real report/ }));
    expect(exited).toBe(true);
  });
});
