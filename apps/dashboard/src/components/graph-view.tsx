import { useCallback, useEffect, useMemo, useState } from "react";
import { Background, Controls, MarkerType, MiniMap, ReactFlow, type Edge, type Node, type NodeProps, type ReactFlowInstance, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDashboardStore } from "../store/dashboard-store.js";
import { getGraphHighlight, type GraphNode as ReportGraphNode, type LoomReport } from "../lib/report.js";
import { cn } from "./ui.js";

function GraphNodeCard({ data, selected }: NodeProps<Node<GraphData>>) {
  return <div className={cn("graph-node", data.changed && "graph-node-changed", selected && "graph-node-selected")}>
    <Handle type="target" position={Position.Left} />
    <div className="graph-node-kind">{data.kind}{data.changed && <span className="changed-dot" />}</div>
    <strong>{data.label}</strong><span>{data.path}</span>
    <Handle type="source" position={Position.Right} />
  </div>;
}

type GraphData = { label: string; path: string; kind: string; changed: boolean };
const nodeTypes = { loom: GraphNodeCard };

export function GraphView({ report, focusNodeId, compact = false }: { report: LoomReport; focusNodeId?: string; compact?: boolean }) {
  const selectedNodeId = useDashboardStore((state) => state.selectedNodeId);
  const selectNode = useDashboardStore((state) => state.selectNode);
  const setSelectedNode = useCallback((id?: string) => selectNode(id), [selectNode]);
  const [query, setQuery] = useState("");
  const [relation, setRelation] = useState("all");
  const [flow, setFlow] = useState<ReactFlowInstance<Node<GraphData>, Edge> | undefined>();
  useEffect(() => { if (focusNodeId) setSelectedNode(focusNodeId); }, [focusNodeId, setSelectedNode]);
  const highlight = useMemo(() => getGraphHighlight(report, selectedNodeId), [report, selectedNodeId]);
  const relationOptions = useMemo(() => [...new Set(report.edges.map((edge) => edge.kind))].sort(), [report.edges]);
  const matchingNodeIds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return new Set(report.nodes.filter((node) => !normalized || `${node.label} ${node.path} ${node.kind}`.toLowerCase().includes(normalized)).map((node) => node.id));
  }, [report.nodes, query]);
  const nodes = useMemo<Node<GraphData>[]>(() => report.nodes.map((node: ReportGraphNode) => ({
    id: node.id, type: "loom", position: node.position,
    data: { label: node.label, path: node.path, kind: node.kind, changed: node.changed },
    className: selectedNodeId && !highlight.nodeIds.has(node.id) ? "graph-node-dimmed" : "",
    hidden: !matchingNodeIds.has(node.id),
  })), [report.nodes, selectedNodeId, highlight.nodeIds, matchingNodeIds]);
  const edges = useMemo<Edge[]>(() => report.edges.map((edge) => ({
    id: edge.id, source: edge.source, target: edge.target, label: compact ? undefined : edge.kind,
    animated: Boolean(selectedNodeId && highlight.edgeIds.has(edge.id)),
    className: selectedNodeId && !highlight.edgeIds.has(edge.id) ? "graph-edge-dimmed" : "",
    markerEnd: { type: MarkerType.ArrowClosed, color: selectedNodeId && highlight.edgeIds.has(edge.id) ? "#86a9ff" : "#536174" },
    style: { stroke: selectedNodeId && highlight.edgeIds.has(edge.id) ? "#86a9ff" : "#536174", strokeWidth: selectedNodeId && highlight.edgeIds.has(edge.id) ? 2 : 1.3 },
    hidden: relation !== "all" && edge.kind !== relation,
  })), [report.edges, compact, selectedNodeId, highlight.edgeIds, relation]);
  return <div className={cn("graph-canvas", compact && "graph-canvas-compact")} aria-label="Impact graph">
    {!compact && <div className="graph-toolbar"><label className="graph-search"><span className="sr-only">Search graph</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search nodes…" /><kbd>/</kbd></label><label className="graph-filter"><span className="sr-only">Filter relationships</span><select value={relation} onChange={(event) => setRelation(event.target.value)}><option value="all">All relationships</option>{relationOptions.map((option) => <option value={option} key={option}>{option}</option>)}</select></label><button className="graph-fit" type="button" onClick={() => flow?.fitView({ padding: 0.16, duration: 180 })}>Fit view</button></div>}
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.16 }} minZoom={0.35} maxZoom={1.5} onInit={setFlow} onNodeClick={(_, node) => setSelectedNode(node.id)} onPaneClick={() => setSelectedNode(undefined)} proOptions={{ hideAttribution: true }}>
      <Background color="#293342" gap={24} size={1} />
      <Controls showInteractive={false} />
      {!compact && <MiniMap nodeColor={(node) => node.data?.changed ? "#86a9ff" : "#536174"} maskColor="rgba(9, 12, 17, .75)" />}
    </ReactFlow>
    <div className="graph-legend"><span><i className="legend-dot legend-changed" />Changed</span><span><i className="legend-dot legend-linked" />Selected path</span><span>Click a node to trace impact</span></div>
    {!compact && <details className="graph-alternative"><summary>Accessible relationship list</summary><ul>{report.edges.filter((edge) => relation === "all" || edge.kind === relation).map((edge) => <li key={edge.id}><code>{report.nodes.find((node) => node.id === edge.source)?.label ?? edge.source}</code><span>{edge.kind}</span><code>{report.nodes.find((node) => node.id === edge.target)?.label ?? edge.target}</code></li>)}</ul></details>}
  </div>;
}
