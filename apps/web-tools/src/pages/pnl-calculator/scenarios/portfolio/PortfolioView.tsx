import { PnlAssetBreakdownTable } from "./components/PnlAssetBreakdownTable";
import { PnlPortfolioDropzone } from "./components/PnlPortfolioDropzone";
import { PnlPortfolioSummaryCard } from "./components/PnlPortfolioSummaryCard";
import { PnlSkippedAccountsList } from "./components/PnlSkippedAccountsList";
import { usePortfolioViewModel } from "./usePortfolioViewModel";

export function PortfolioView() {
  const { fiatTicker, status, formatted, onFiles, reset } = usePortfolioViewModel();

  return (
    <div className="flex flex-col gap-24">
      <PnlPortfolioDropzone status={status} onFiles={onFiles} onReset={reset} />

      {status.kind === "ready" && formatted ? (
        <>
          <PnlPortfolioSummaryCard
            fiatTicker={fiatTicker}
            accountsCount={formatted.rows.length}
            formattedCostBasis={formatted.formattedCostBasis}
            formattedRealised={formatted.formattedRealised}
            formattedUnrealised={formatted.formattedUnrealised}
            formattedTotal={formatted.formattedTotal}
            formattedPctVsCost={formatted.formattedPctVsCost}
            totalTone={formatted.totalTone}
            realisedTone={formatted.realisedTone}
            unrealisedTone={formatted.unrealisedTone}
          />

          <PnlAssetBreakdownTable rows={formatted.rows} />

          <PnlSkippedAccountsList
            decodeFailures={formatted.decodeFailures}
            unsupported={formatted.unsupported}
          />
        </>
      ) : null}
    </div>
  );
}
