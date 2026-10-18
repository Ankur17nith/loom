import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { demoReport } from "../data/demo-report.js";
import { FindingsPage, FindingDetailPage } from "../pages/dashboard-pages.js";
import { AppLayout } from "./layout.js";
import { useDashboardStore } from "../store/dashboard-store.js";

function resetStore() {
  useDashboardStore.setState({ findingQuery: "", severityFilter: "all", statusFilter: "all", selectedFindingId: undefined, selectedNodeId: undefined, commandPaletteOpen: false, sidebarOpen: false });
}

describe("dashboard components", () => {
  it("filters findings in the real findings view", () => {
    resetStore();
    render(<MemoryRouter initialEntries={["/findings"]}><FindingsPage report={demoReport} /></MemoryRouter>);
    expect(screen.getByText("Payment status contract changed")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Severity"), { target: { value: "critical" } });
    expect(screen.getByText("Retry can duplicate an order")).toBeInTheDocument();
    expect(screen.queryByText("Payment status contract changed")).not.toBeInTheDocument();
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

  it("opens the command palette and navigates from a command", () => {
    resetStore();
    render(<MemoryRouter initialEntries={["/"]}><Routes><Route element={<AppLayout report={demoReport} />}><Route index element={<div>Overview route</div>} /><Route path="/graph" element={<div>Graph route</div>} /></Route></Routes></MemoryRouter>);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Command menu" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Explore impact graph/ }));
    expect(screen.getByText("Graph route")).toBeInTheDocument();
  });

  it("selects and navigates to a finding from the findings list", () => {
    resetStore();
    render(<MemoryRouter initialEntries={["/findings"]}><Routes><Route path="/findings" element={<FindingsPage report={demoReport} />} /><Route path="/findings/:findingId" element={<div>Finding details route</div>} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Open finding Payment status contract changed/ }));
    expect(screen.getByText("Finding details route")).toBeInTheDocument();
  });
});
