import { BigNumber } from "bignumber.js";
import { formatFeesValue } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import type { Unit } from "@domain/entity-currency-unit";
import type { SponsoredFeeQuote } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import type { FeeAmountDisplay, SponsoredFeeAmounts } from "../types";

type FormatSponsoredFeeAmountsParams = Readonly<{
  quote: SponsoredFeeQuote;
  feeUnit: Unit;
  nativeUnit: Unit;
  fiatUnit: Unit;
  sponsoredFeeFiat: BigNumber | null;
  standardFeeFiat: BigNumber | null;
  locale?: string;
}>;

function formatFeeAmount(
  amount: bigint,
  unit: Unit,
  fiat: BigNumber | null,
  fiatUnit: Unit,
  locale: string | undefined,
): FeeAmountDisplay {
  const { displayFeesValue, secondaryFeesValue } = formatFeesValue({
    estimatedFees: new BigNumber(amount.toString()),
    estimatedFeesCountervalue: fiat,
    fiatUnit,
    displayUnit: unit,
    locale,
    mode: "both",
  });
  return { value: displayFeesValue, secondaryValue: secondaryFeesValue };
}

export function formatSponsoredFeeAmounts({
  quote,
  feeUnit,
  nativeUnit,
  fiatUnit,
  sponsoredFeeFiat,
  standardFeeFiat,
  locale,
}: FormatSponsoredFeeAmountsParams): SponsoredFeeAmounts {
  const sponsored = formatFeeAmount(quote.value, feeUnit, sponsoredFeeFiat, fiatUnit, locale);
  const standard = formatFeeAmount(
    quote.originalValue,
    nativeUnit,
    standardFeeFiat,
    fiatUnit,
    locale,
  );
  // With both fiat prices set, each `value` is fiat, so the struck price compares like with like.
  const savesFiat = !!sponsoredFeeFiat?.gt(0) && !!standardFeeFiat?.gt(sponsoredFeeFiat);
  return {
    sponsored: { ...sponsored, originalValue: savesFiat ? standard.value : null },
    standard,
  };
}
