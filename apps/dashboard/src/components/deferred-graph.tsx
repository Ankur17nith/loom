import { lazy, Suspense } from "react";
import type { GraphViewProps } from "./graph-view.js";
import { LoadingState } from "./ui.js";

const GraphView = lazy(() => import("./graph-view.js").then((module) => ({ default: module.GraphView })));

export function DeferredGraphView(props: GraphViewProps) {
  return <Suspense fallback={<LoadingState label="Loading impact graph" />}><GraphView {...props} /></Suspense>;
}
