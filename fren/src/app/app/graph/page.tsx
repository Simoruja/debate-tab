import { Suspense } from "react";
import { Loading } from "@/components/ui";
import { GraphView } from "./graph-view";

export default function GraphPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GraphView />
    </Suspense>
  );
}
