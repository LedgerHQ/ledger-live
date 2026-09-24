import BigNumber from "bignumber.js";
import { formatCurrencyUnit, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import { findFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import type { Unit } from "@domain/entity-currency-unit";
import type { FormatCardTransactionAmount } from "@features/flow-pay-card-transactions";

const CRYPTO_MAGNITUDE_BY_TICKER: Readonly<Record<string, number>> = {
  BTC: 8,
  ETH: 18,
  USDC: 6,
  USDT: 6,
};

type FormatCardTransactionAmountArgs = Readonly<{
  value: string;
  currency: string;
  kind: Parameters<FormatCardTransactionAmount>[2];
  locale: string;
}>;

export function formatCardTransactionAmount({
  value,
  currency,
  kind,
  locale,
}: FormatCardTransactionAmountArgs): string {
  const ticker = currency.toUpperCase();
  const unit: Unit =
    kind === "fiat"
      ? (findFiatCurrencyByTicker(ticker)?.units[0] ?? {
          name: ticker,
          code: ticker,
          magnitude: 2,
        })
      : {
          name: ticker,
          code: ticker,
          magnitude: CRYPTO_MAGNITUDE_BY_TICKER[ticker] ?? 8,
        };

  return formatCurrencyUnit(unit, valueFromUnit(new BigNumber(value), unit), {
    locale,
    showCode: true,
    alwaysShowSign: value.startsWith("+"),
    disableRounding: kind === "crypto",
  });
}
