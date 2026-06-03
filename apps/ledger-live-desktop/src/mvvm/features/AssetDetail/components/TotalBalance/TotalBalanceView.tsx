import React from "react";

export type TotalBalanceViewProps = Readonly<{
  totalBalanceLabel: string;
  fiatAriaLabel: string;
  prefixSymbol: string | null;
  suffixSymbol: string | null;
  hasDecimals: boolean;
  integerPart: string;
  decimalSeparator: string;
  decimalPart?: string;
  cryptoBalance: React.ReactNode;
}>;

export function TotalBalanceView({
  totalBalanceLabel,
  fiatAriaLabel,
  prefixSymbol,
  suffixSymbol,
  hasDecimals,
  integerPart,
  decimalSeparator,
  decimalPart,
  cryptoBalance,
}: TotalBalanceViewProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="asset-detail-total-balance">
      <p className="body-3 text-muted">{totalBalanceLabel}</p>

      <div className="flex min-w-0 flex-wrap items-baseline gap-4">
        <span
          className="heading-2-semi-bold inline-flex flex-wrap items-baseline text-base tabular-nums"
          data-testid="asset-detail-fiat-balance"
          aria-label={fiatAriaLabel}
        >
          {prefixSymbol ? <span className="me-4">{prefixSymbol}</span> : null}
          <span>{integerPart}</span>
          {hasDecimals ? (
            <>
              <span>{decimalSeparator}</span>
              <span>{decimalPart}</span>
            </>
          ) : null}
          {suffixSymbol ? <span className="ms-4">{suffixSymbol}</span> : null}
        </span>
        <span className="body-2 select-none text-muted" aria-hidden>
          /
        </span>
        {cryptoBalance}
      </div>
    </div>
  );
}
