import { create } from "zustand";
import type { FindingSeverity, FindingStatus } from "../lib/report.js";

type DashboardState = {
  selectedFindingId?: string;
  selectedNodeId?: string;
  findingQuery: string;
  severityFilter: FindingSeverity | "all";
  statusFilter: FindingStatus | "all";
  commandPaletteOpen: boolean;
  sidebarOpen: boolean;
  selectFinding: (id?: string) => void;
  selectNode: (id?: string) => void;
  setFindingQuery: (value: string) => void;
  setSeverityFilter: (value: FindingSeverity | "all") => void;
  setStatusFilter: (value: FindingStatus | "all") => void;
  setCommandPaletteOpen: (value: boolean) => void;
  setSidebarOpen: (value: boolean) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  findingQuery: "",
  severityFilter: "all",
  statusFilter: "all",
  commandPaletteOpen: false,
  sidebarOpen: false,
  selectFinding: (selectedFindingId) => set({ selectedFindingId }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  setFindingQuery: (findingQuery) => set({ findingQuery }),
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
