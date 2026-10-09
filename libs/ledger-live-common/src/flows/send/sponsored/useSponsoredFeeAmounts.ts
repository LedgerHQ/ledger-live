import { useMemo } from "react";
import type { BigNumber } from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";
import { formatCurrencyUnit } from "@ledgerhq/live-currency-format";
import type { SponsoredFeeQuote } from "../../../bridge/generic-coin-framework/sponsored";
import { formatSponsoredFeeAmounts } from "./feeAmounts";
import type { SponsoredFeeAmounts } from "./types";

type UseSponsoredFeeAmountsParams = Readonly<{
  quote: SponsoredFeeQuote | null;
  /** The main account's unit, which the standard fee is paid in. */
  nativeUnit: Unit | null | undefined;
  fiatUnit: Unit;
  savingsFiat: BigNumber | null;
  sponsoredFeeFiat: BigNumber | null;
  standardFeeFiat: BigNumber | null;
  locale?: string;
}>;

export type SponsoredFeeAmountsDisplay = Readonly<{
  sponsoredFeeAmounts: SponsoredFeeAmounts | null;
  /** Null unless the sponsored fee saves a positive fiat amount. */
  savingsFiatFormatted: string | null;
}>;

export function useSponsoredFeeAmounts({
  quote,
  nativeUnit,
  fiatUnit,
  savingsFiat,
  sponsoredFeeFiat,
  standardFeeFiat,
  locale,
}: UseSponsoredFeeAmountsParams): SponsoredFeeAmountsDisplay {
  const savingsFiatFormatted = useMemo(
    () =>
      savingsFiat?.gt(0)
        ? formatCurrencyUnit(fiatUnit, savingsFiat, {
            showCode: true,
            disableRounding: true,
            locale,
          })
        : null,
    [savingsFiat, fiatUnit, locale],
  );

  const sponsoredFeeAmounts = useMemo(() => {
    const feeUnit = quote?.feeAsset.unit;
    if (!quote || !feeUnit || !nativeUnit) return null;
    return formatSponsoredFeeAmounts({
      quote,
      feeUnit,
      nativeUnit,
      fiatUnit,
      sponsoredFeeFiat,
      standardFeeFiat,
      locale,
    });
  }, [quote, nativeUnit, fiatUnit, sponsoredFeeFiat, standardFeeFiat, locale]);

  return useMemo(
    () => ({ sponsoredFeeAmounts, savingsFiatFormatted }),
    [sponsoredFeeAmounts, savingsFiatFormatted],
  );
}
