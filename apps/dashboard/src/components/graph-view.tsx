import { useCallback, useEffect, useMemo, useState } from "react";
import { Background, Controls, MarkerType, MiniMap, ReactFlow, type Edge, type Node, type NodeProps, type ReactFlowInstance, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowDown, ArrowUp, List, Maximize2, Search, SlidersHorizontal } from "lucide-react";
import { getGraphHighlight, type GraphNode as ReportGraphNode, type GraphScope, type LoomReport } from "../lib/report.js";
import { useDashboardStore } from "../store/dashboard-store.js";
import { cn } from "./ui.js";

type GraphData = { label: string; path: string; kind: string; changed: boolean };
const nodeTypes = { loom: GraphNodeCard };

function GraphNodeCard({ data, selected }: NodeProps<Node<GraphData>>) {
  return <div className={cn("graph-node", `graph-node-kind-${data.kind}`, data.changed && "graph-node-changed", selected && "graph-node-selected")}>
    <Handle type="target" position={Position.Left} />
    <div className="graph-node-topline">
      <span>{data.kind}</span>
      {data.changed && <i aria-label="Changed node" title="Changed node" />}
    </div>
    <strong>{data.label}</strong>
    <code>{data.path}</code>
    <Handle type="source" position={Position.Right} />
  </div>;
}

export interface GraphViewProps {
  report: LoomReport;
  focusNodeId?: string;
  scope?: GraphScope;
  compact?: boolean;
}

export function GraphView({ report, focusNodeId, scope, compact = false }: GraphViewProps) {
  const selectedNodeId = useDashboardStore((state) => state.selectedNodeId);
  const selectNode = useDashboardStore((state) => state.selectNode);
  const setSelectedNode = useCallback((id?: string) => selectNode(id), [selectNode]);
  const [query, setQuery] = useState("");
  const [relation, setRelation] = useState("all");
  const [changedOnly, setChangedOnly] = useState(false);
  const [flow, setFlow] = useState<ReactFlowInstance<Node<GraphData>, Edge>>();

  useEffect(() => {
    if (focusNodeId) setSelectedNode(focusNodeId);
  }, [focusNodeId, setSelectedNode]);

  const highlight = useMemo(() => getGraphHighlight(report, selectedNodeId, scope), [report, scope, selectedNodeId]);
  const active = Boolean(selectedNodeId || scope);
  const relationOptions = useMemo(() => [...new Set(report.edges.map((edge) => edge.kind))].sort(), [report.edges]);
  const normalizedQuery = query.trim().toLowerCase();
  const matchingNodeIds = useMemo(() => new Set(report.nodes.filter((node) => (!normalizedQuery || `${node.label} ${node.path} ${node.kind}`.toLowerCase().includes(normalizedQuery)) && (!changedOnly || node.changed || highlight.nodeIds.has(node.id))).map((node) => node.id)), [report.nodes, normalizedQuery, changedOnly, highlight.nodeIds]);
  const matchedCount = matchingNodeIds.size;

  const nodes = useMemo<Node<GraphData>[]>(() => report.nodes.map((node: ReportGraphNode) => ({
    id: node.id,
    type: "loom",
    position: node.position,
    data: { label: node.label, path: node.path, kind: node.kind, changed: node.changed },
    className: active && !highlight.nodeIds.has(node.id) ? "graph-node-dimmed" : "",
    hidden: !matchingNodeIds.has(node.id),
  })), [report.nodes, active, highlight.nodeIds, matchingNodeIds]);

  const edges = useMemo<Edge[]>(() => report.edges.map((edge) => {
    const emphasized = active && highlight.edgeIds.has(edge.id);
    const visibleByFilter = relation === "all" || edge.kind === relation;
    const visibleByNodes = matchingNodeIds.has(edge.source) && matchingNodeIds.has(edge.target);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: compact ? undefined : edge.kind,
      animated: Boolean(emphasized),
      className: active && !emphasized ? "graph-edge-dimmed" : "",
      markerEnd: { type: MarkerType.ArrowClosed, color: emphasized ? "#87b4ff" : "#596779" },
      style: { stroke: emphasized ? "#87b4ff" : "#596779", strokeWidth: emphasized ? 2.4 : 1.25 },
      hidden: !visibleByFilter || !visibleByNodes,
    };
  }), [report.edges, compact, active, highlight.edgeIds, relation, matchingNodeIds]);

  const fit = () => flow?.fitView({ padding: 0.18, duration: 220 });

  return <div className={cn("graph-canvas", compact && "graph-canvas-compact")} aria-label="Impact graph">
    {!compact && <div className="graph-toolbar">
      <label className="graph-search">
        <Search size={15} aria-hidden="true" />
        <span className="sr-only">Search graph nodes</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a node or path" aria-label="Find a node or path" />
        <span className="graph-match-count">{matchedCount}/{report.nodes.length}</span>
      </label>
      <label className="graph-select">
        <SlidersHorizontal size={14} aria-hidden="true" />
        <span className="sr-only">Filter relationships</span>
        <select value={relation} onChange={(event) => setRelation(event.target.value)} aria-label="Filter relationships">
          <option value="all">All relationships</option>
          {relationOptions.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      </label>
      <button className={cn("graph-tool-button", changedOnly && "graph-tool-button-active")} type="button" onClick={() => setChangedOnly((value) => !value)} aria-pressed={changedOnly}>
        <span className="graph-tool-dot" aria-hidden="true" />
        Changed only
      </button>
      <button className="graph-tool-button" type="button" onClick={fit} aria-label="Fit view to graph nodes">
        <Maximize2 size={14} aria-hidden="true" />
        Fit view
      </button>
    </div>}
    <div className="graph-flow-frame">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.18 }} minZoom={0.3} maxZoom={1.7} onInit={setFlow} onNodeClick={(_, node) => setSelectedNode(node.id)} onPaneClick={() => setSelectedNode(undefined)} proOptions={{ hideAttribution: true }}>
        <Background color="#232d39" gap={28} size={1} />
        <Controls showInteractive={false} />
        {!compact && <MiniMap nodeColor={(node) => node.data?.changed ? "#87b4ff" : "#596779"} maskColor="rgba(8, 11, 16, .78)" />}
      </ReactFlow>
      {!compact && <div className="graph-overlay-legend">
        <span><i className="legend-dot legend-changed" aria-hidden="true" />Changed</span>
        <span><i className="legend-dot legend-linked" aria-hidden="true" />Evidence path</span>
        <span>{active ? "Unrelated context dimmed" : "Select a node to trace"}</span>
      </div>}
    </div>
    {compact ? <div className="graph-compact-caption">
      <span><List size={13} aria-hidden="true" />{report.nodes.length} nodes · {report.edges.length} relationships</span>
      <span>Click a node in the full workspace to inspect it</span>
    </div> : <details className="graph-relationship-list">
      <summary><List size={14} aria-hidden="true" />Accessible relationship list <span>{report.edges.length}</span></summary>
      <div className="relationship-list-grid">
        {report.edges.filter((edge) => relation === "all" || edge.kind === relation).map((edge) => <div className="relationship-list-row" key={edge.id}>
          <code>{report.nodes.find((node) => node.id === edge.source)?.label ?? edge.source}</code>
          <span>{edge.kind === "imports" || edge.kind === "calls" ? <ArrowDown size={12} aria-hidden="true" /> : <ArrowUp size={12} aria-hidden="true" />}{edge.kind}</span>
          <code>{report.nodes.find((node) => node.id === edge.target)?.label ?? edge.target}</code>
        </div>)}
      </div>
    </details>}
  </div>;
}
