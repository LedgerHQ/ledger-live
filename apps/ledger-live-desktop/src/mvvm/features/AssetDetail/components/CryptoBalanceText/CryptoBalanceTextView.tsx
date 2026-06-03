import React from "react";

export type CryptoBalanceTextViewProps = Readonly<{
  prefixSymbol: string | null;
  suffixSymbol: string | null;
  hasDecimals: boolean;
  integerPart: string;
  decimalSeparator: string;
  decimalPart?: string;
}>;

export function CryptoBalanceTextView({
  prefixSymbol,
  suffixSymbol,
  hasDecimals,
  integerPart,
  decimalSeparator,
  decimalPart,
}: CryptoBalanceTextViewProps) {
  return (
    <span
      className="body-3 text-muted inline-flex flex-wrap items-baseline gap-0 tabular-nums"
      data-testid="asset-detail-crypto-balance"
    >
      {prefixSymbol ? <span className="mr-1">{prefixSymbol}</span> : null}
      <span>{integerPart}</span>
      {hasDecimals ? (
        <>
          <span>{decimalSeparator}</span>
          <span>{decimalPart}</span>
        </>
      ) : null}
      {suffixSymbol ? <span className="ml-1">{suffixSymbol}</span> : null}
    </span>
  );
}
