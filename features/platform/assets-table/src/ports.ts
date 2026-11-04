import type { ComponentType } from "react";
import type { Currency } from "@domain/entity-currency";
import type { Unit } from "@domain/entity-currency-unit";
import type { BigNumber } from "bignumber.js";
import type { AssetTrendRange } from "./types";

export type AssetAmountCellProps = {
  readonly currency: Currency;
  readonly balance: number;
};

export type TruncatedTextProps = {
  readonly text: string;
  readonly className?: string;
  readonly as?: "div" | "span";
};

export type FormatAssetAmount = (
  unit: Unit,
  value: BigNumber,
  options?: { readonly showCode?: boolean },
) => string;

export type CurrencyPortfolioSnapshot = {
  readonly history: ReadonlyArray<{
    readonly value: number;
    readonly countervalue?: number | null;
  }>;
  readonly countervalueChange: {
    readonly percentage?: number | null;
    readonly value: number;
  };
};

export type AssetsTablePorts = {
  readonly counterValueCurrency: Currency;
  readonly discreet: boolean;
  readonly formatCounterValue: FormatAssetAmount;
  readonly formatPrice: FormatAssetAmount;
  readonly getCurrencyPortfolio: (
    accounts: readonly unknown[],
    range: AssetTrendRange,
  ) => CurrencyPortfolioSnapshot;
  readonly getCurrentBalanceCountervalueChange: (
    accounts: readonly unknown[],
    range: AssetTrendRange,
  ) => { readonly percentage?: number | null };
  readonly BalanceCell: ComponentType<AssetAmountCellProps>;
  readonly CounterValueCell: ComponentType<AssetAmountCellProps>;
  readonly TruncatedText: ComponentType<TruncatedTextProps>;
};
