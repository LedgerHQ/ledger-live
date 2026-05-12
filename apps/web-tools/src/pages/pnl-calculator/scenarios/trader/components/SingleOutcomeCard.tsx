import { PnlOutcomeCard } from "../../../shared/components/PnlOutcomeCard";
import type { PnlCardIcon, PnlHeadline, PnlStat } from "../../../shared/components/types";
import type { TraderSingleVM } from "../useTraderViewModel";

type SingleOutcomeCardProps = Readonly<{
  single: TraderSingleVM;
  fiatTicker: string;
}>;

export function SingleOutcomeCard({ single, fiatTicker }: SingleOutcomeCardProps) {
  const icons: PnlCardIcon[] = [{ ledgerId: single.asset.currency.id, ticker: single.ticker }];
  const headline: PnlHeadline = {
    value: single.formattedTotalPnL,
    tone: single.totalTone,
    sub: { value: `${single.formattedPctVsCost} · total PnL` },
  };
  const stats: PnlStat[] = [
    { id: "balance", label: "Final balance", value: single.formattedFinalBalance },
    { id: "cost", label: "Cost basis", value: single.formattedCostBasis },
    {
      id: "realised",
      label: "Realised PnL",
      value: single.formattedRealised,
      tone: single.realisedTone,
    },
    {
      id: "unrealised",
      label: "Unrealised PnL",
      value: single.formattedUnrealised,
      tone: single.unrealisedTone,
    },
  ];

  return (
    <PnlOutcomeCard
      icons={icons}
      title="Outcome"
      description={`${fiatTicker} · ${single.ticker} trading account`}
      headline={headline}
      stats={stats}
      footer="FEES are classified as outflows (OPERATION_TYPE_OUT_FAMILY), so they reduce the cost basis just like a sale."
    />
  );
}
