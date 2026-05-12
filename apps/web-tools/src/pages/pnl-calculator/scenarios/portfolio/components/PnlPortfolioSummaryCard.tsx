import type { CSSProperties } from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardFooter,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";
import { PnlStatsList } from "../../../shared/components/PnlStatsList";

type PnlPortfolioSummaryCardProps = Readonly<{
  fiatTicker: string;
  accountsCount: number;
  formattedCostBasis: string;
  formattedRealised: string;
  formattedUnrealised: string;
  formattedTotal: string;
  formattedPctVsCost: string;
  totalTone: CSSProperties;
  realisedTone: CSSProperties;
  unrealisedTone: CSSProperties;
}>;

export function PnlPortfolioSummaryCard({
  fiatTicker,
  accountsCount,
  formattedCostBasis,
  formattedRealised,
  formattedUnrealised,
  formattedTotal,
  formattedPctVsCost,
  totalTone,
  realisedTone,
  unrealisedTone,
}: PnlPortfolioSummaryCardProps) {
  return (
    <Card type="info" className="w-full min-w-0">
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>Portfolio total</CardContentTitle>
            <CardContentDescription>
              {accountsCount} account{accountsCount === 1 ? "" : "s"} · {fiatTicker}
            </CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <CardContent>
            <CardContentTitle style={totalTone}>{formattedTotal}</CardContentTitle>
            <CardContentDescription style={totalTone}>{formattedPctVsCost}</CardContentDescription>
          </CardContent>
        </CardTrailing>
      </CardHeader>

      <CardFooter className="flex flex-col gap-16">
        <PnlStatsList
          stats={[
            { id: "cost", label: "Cost basis", value: formattedCostBasis },
            { id: "real", label: "Realised PnL", value: formattedRealised, tone: realisedTone },
            {
              id: "unreal",
              label: "Unrealised PnL",
              value: formattedUnrealised,
              tone: unrealisedTone,
            },
          ]}
        />
        <CardContentDescription className="pt-8">
          Computed with average cost basis on a fresh counter-values pull (USD).
        </CardContentDescription>
      </CardFooter>
    </Card>
  );
}
