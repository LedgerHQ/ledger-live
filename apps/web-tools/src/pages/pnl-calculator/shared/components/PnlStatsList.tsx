import { PnlFooterStatRow } from "./PnlFooterStatRow";
import type { PnlStat } from "./types";

type PnlStatsListProps = Readonly<{
  stats: PnlStat[];
}>;

export function PnlStatsList({ stats }: PnlStatsListProps) {
  return (
    <>
      {stats.map((stat, idx) => (
        <PnlFooterStatRow
          key={stat.id ?? idx}
          label={stat.label}
          value={stat.value}
          valueTone={stat.tone}
        />
      ))}
    </>
  );
}
