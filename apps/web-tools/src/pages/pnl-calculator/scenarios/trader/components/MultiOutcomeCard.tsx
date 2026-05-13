import { PnlOutcomeCard } from "../../../shared/components/PnlOutcomeCard";
import type { PnlHeadline, PnlStat } from "../../../shared/components/types";
import type { TraderMultiVM } from "../useTraderViewModel";
import { uniqueIcons } from "./uniqueIcons";

type MultiOutcomeCardProps = Readonly<{
  multi: TraderMultiVM;
  fiatTicker: string;
}>;

export function MultiOutcomeCard({ multi, fiatTicker }: MultiOutcomeCardProps) {
  const headline: PnlHeadline = {
    value: multi.totals.formattedTotalPnL,
    tone: multi.totals.totalTone,
    sub: { value: `${multi.totals.formattedPctVsCost} · portfolio PnL` },
  };

  const stats: PnlStat[] = [
    ...multi.accounts.map((a, idx) => ({
      id: `account-${a.id}`,
      label: `${a.ticker} #${idx + 1} cost / PnL`,
      value: (
        <>
          {a.formattedCostBasis} ·{" "}
          <span style={a.totalTone}>
            {a.formattedTotalPnL} ({a.formattedPctVsCost})
          </span>
        </>
      ),
    })),
    {
      id: "portfolioCost",
      label: "Portfolio cost basis",
      value: multi.totals.formattedCostBasis,
    },
    {
      id: "portfolioRealised",
      label: "Portfolio realised",
      value: multi.totals.formattedRealised,
      tone: multi.totals.realisedTone,
    },
    {
      id: "portfolioUnrealised",
      label: "Portfolio unrealised",
      value: multi.totals.formattedUnrealised,
      tone: multi.totals.unrealisedTone,
    },
  ];

  return (
    <PnlOutcomeCard
      icons={uniqueIcons(multi)}
      title="Outcome"
      description={`${fiatTicker} · portfolio aggregate`}
      headline={headline}
      stats={stats}
      footer="Portfolio totals = elementwise sum of per-asset computeAssetPnL across all accounts."
    />
  );
}
