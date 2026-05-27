import React from "react";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { AmountDisplay } from "@ledgerhq/lumen-ui-react";

export type TotalBalanceViewProps = Readonly<{
  totalBalanceLabel: string;
  fiatDisplayValue: number;
  fiatFormatter: (value: number) => FormattedValue;
  hidden: boolean;
  cryptoBalance: React.ReactNode;
}>;

export function TotalBalanceView({
  totalBalanceLabel,
  fiatDisplayValue,
  fiatFormatter,
  hidden,
  cryptoBalance,
}: TotalBalanceViewProps) {
  return (
    <div className="flex flex-col gap-8" data-testid="asset-detail-total-balance">
      <p className="body-3 text-muted">{totalBalanceLabel}</p>

      <div className="flex min-w-0 flex-wrap items-baseline gap-4">
        <AmountDisplay
          value={fiatDisplayValue}
          formatter={fiatFormatter}
          hidden={hidden}
          data-testid="asset-detail-fiat-balance"
        />
        <span className="body-2 select-none text-muted" aria-hidden>
          /
        </span>
        {cryptoBalance}
      </div>
    </div>
  );
}
