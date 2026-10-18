import { useCallback, useEffect, useMemo } from "react";
import { Background, Controls, MarkerType, MiniMap, ReactFlow, type Edge, type Node, type NodeProps, Handle, Position } from "@xyflow/react";
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
  useEffect(() => { if (focusNodeId) setSelectedNode(focusNodeId); }, [focusNodeId, setSelectedNode]);
  const highlight = useMemo(() => getGraphHighlight(report, selectedNodeId), [report, selectedNodeId]);
  const nodes = useMemo<Node<GraphData>[]>(() => report.nodes.map((node: ReportGraphNode) => ({
    id: node.id, type: "loom", position: node.position,
    data: { label: node.label, path: node.path, kind: node.kind, changed: node.changed },
    className: selectedNodeId && !highlight.nodeIds.has(node.id) ? "graph-node-dimmed" : "",
  })), [report.nodes, selectedNodeId, highlight.nodeIds]);
  const edges = useMemo<Edge[]>(() => report.edges.map((edge) => ({
    id: edge.id, source: edge.source, target: edge.target, label: compact ? undefined : edge.kind,
    animated: Boolean(selectedNodeId && highlight.edgeIds.has(edge.id)),
    className: selectedNodeId && !highlight.edgeIds.has(edge.id) ? "graph-edge-dimmed" : "",
    markerEnd: { type: MarkerType.ArrowClosed, color: selectedNodeId && highlight.edgeIds.has(edge.id) ? "#86a9ff" : "#536174" },
    style: { stroke: selectedNodeId && highlight.edgeIds.has(edge.id) ? "#86a9ff" : "#536174", strokeWidth: selectedNodeId && highlight.edgeIds.has(edge.id) ? 2 : 1.3 },
  })), [report.edges, compact, selectedNodeId, highlight.edgeIds]);
  return <div className={cn("graph-canvas", compact && "graph-canvas-compact")} aria-label="Impact graph">
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.16 }} minZoom={0.35} maxZoom={1.5} onNodeClick={(_, node) => setSelectedNode(node.id)} onPaneClick={() => setSelectedNode(undefined)} proOptions={{ hideAttribution: true }}>
      <Background color="#293342" gap={24} size={1} />
      <Controls showInteractive={false} />
      {!compact && <MiniMap nodeColor={(node) => node.data?.changed ? "#86a9ff" : "#536174"} maskColor="rgba(9, 12, 17, .75)" />}
    </ReactFlow>
    <div className="graph-legend"><span><i className="legend-dot legend-changed" />Changed</span><span><i className="legend-dot legend-linked" />Selected path</span><span>Click a node to trace impact</span></div>
  </div>;
}
