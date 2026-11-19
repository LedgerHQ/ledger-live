import { useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { StakePositionFormatter } from "@features/flow-stake-position";
import { useSelector } from "LLD/hooks/redux";
import { useCountervalueFormatter } from "LLD/hooks/useCountervalueFormatter";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

/** The account's unit, the locale, the counter value and discreet mode, for the package's figures. */
export function useStakePositionFormatter(account: SolanaAccount): StakePositionFormatter {
  const unit = useAccountUnit(account);
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useDiscreetMode();
  const calculateCountervalue = useCalculateCountervalueCallback();
  const countervalueFormatter = useCountervalueFormatter();
  const { currency } = account;

  return useMemo(() => {
    const countervalueOf = (baseUnits: string) =>
      calculateCountervalue(currency, new BigNumber(baseUnits));
    const percentFormat = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 2,
    });

    return {
      amount: baseUnits => {
        const countervalue = countervalueOf(baseUnits);
        return {
          crypto: formatCurrencyUnit(unit, new BigNumber(baseUnits), {
            showCode: true,
            discreet,
            locale,
          }),
          fiat: countervalue
            ? formatCurrencyUnit(counterValueCurrency.units[0], countervalue, {
                showCode: true,
                discreet,
                locale,
              })
            : undefined,
        };
      },
      rewardsHeadline: baseUnits => {
        const countervalue = countervalueOf(baseUnits);
        return countervalue
          ? { value: countervalue.toNumber(), formatter: countervalueFormatter, hidden: discreet }
          : undefined;
      },
      percent: fraction => percentFormat.format(fraction),
    };
  }, [
    calculateCountervalue,
    counterValueCurrency,
    countervalueFormatter,
    currency,
    discreet,
    locale,
    unit,
  ]);
}
