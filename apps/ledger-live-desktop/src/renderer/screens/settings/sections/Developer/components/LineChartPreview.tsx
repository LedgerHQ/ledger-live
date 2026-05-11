import React from "react";
import { LineChart } from "@ledgerhq/lumen-ui-react-visualization";

const DEMO_SERIES = [
  {
    id: "aggregated-assets-preview",
    data: [12, 19, 14, 25, 22, 30, 28, 35, 33, 40, 38, 45, 42, 50, 48, 55, 53, 60, 58, 65],
    label: "Aggregated Assets",
    stroke: "var(--color-background-accent-ledger-live)",
  },
];

export function LineChartPreview() {
  return (
    <div className="w-full overflow-hidden rounded-md" style={{ minHeight: 120 }}>
      <LineChart series={DEMO_SERIES} height={120} width="100%" showArea />
    </div>
  );
}
