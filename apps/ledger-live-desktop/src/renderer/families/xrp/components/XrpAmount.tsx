import React from "react";
import type BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { formatFeesValue } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

type Props = Readonly<{
  currency: CryptoCurrency;
  value: BigNumber;
  size: "sm" | "md";
}>;

// Figma puts the native amount first, unlike the send flow's fee row
export function XrpAmount({ currency, value, size }: Props) {
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const amount = formatFeesValue({
    locale,
    estimatedFees: value,
    estimatedFeesCountervalue: calculateCountervalue(currency, value),
    fiatUnit: counterValueCurrency.units[0],
    displayUnit: currency.units[0],
    mode: "both",
  });

  if (!amount.secondaryFeesValue) {
    return amount.displayFeesValue;
  }

  return (
    <span className="flex items-center gap-4">
      <span className={size === "md" ? "body-2 text-muted" : "body-3 text-muted"}>
        {`${amount.secondaryFeesValue} ·`}
      </span>
      {amount.displayFeesValue}
    </span>
  );
}
