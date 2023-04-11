import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { useBalanceHistoryWithCountervalue } from "~/renderer/actions/portfolio";
import { BigNumber } from "bignumber.js";
import { formatShort } from "@ledgerhq/live-common/currencies/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useTimeRange } from "~/renderer/actions/settings";
import { counterValueCurrencySelector, discreetModeSelector } from "~/renderer/reducers/settings";
import Chart from "~/renderer/components/Chart";
import Box, { Card } from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import AccountBalanceSummaryHeader from "./AccountBalanceSummaryHeader";
import perFamilyAccountBalanceSummaryFooter from "~/renderer/generated/AccountBalanceSummaryFooter";
import FormattedDate from "~/renderer/components/FormattedDate";
type Props = {
  chartColor: string;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  countervalueFirst: boolean;
  setCountervalueFirst: (a: boolean) => void;
  mainAccount: Account | undefined | null;
};
export default function AccountBalanceSummary({
  account,
  countervalueFirst,
  chartColor,
  setCountervalueFirst,
  mainAccount,
  parentAccount,
}: Props) {
  const [range] = useTimeRange();
  const counterValue = useSelector(counterValueCurrencySelector);
  const {
    history,
    countervalueAvailable,
    countervalueChange,
    cryptoChange,
  } = useBalanceHistoryWithCountervalue({
    account,
    range,
  });
  const discreetMode = useSelector(discreetModeSelector);
  const renderTooltip = useCallback(
    (d: any) => {
      const displayCountervalue = countervalueFirst && countervalueAvailable;
      const unit = getAccountUnit(account);
      const data = [
        {
          val: d.value,
          unit,
        },
        {
          val: d.countervalue,
          unit: counterValue.units[0],
        },
      ];
      if (displayCountervalue) data.reverse();
      return (
        <>
          <FormattedVal fontSize={5} color="palette.text.shade100" showCode {...data[0]} />
          {countervalueAvailable ? (
            <FormattedVal fontSize={4} color="warmGrey" showCode {...data[1]} />
          ) : null}
          <Box ff="Inter|Regular" color="palette.text.shade60" fontSize={3} mt={2}>
            <FormattedDate date={d.date} format="L" />
          </Box>
          <Box ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
            <FormattedDate date={d.date} format="LT" />
          </Box>
        </>
      );
    },
    [account, counterValue.units, countervalueAvailable, countervalueFirst],
  );
  const renderTickYCryptoValue = useCallback(
    (val: any) => {
      const unit = getAccountUnit(account);
      return formatShort(unit, BigNumber(val));
    },
    [account],
  );
  const renderTickYCounterValue = useCallback(
    (val: number) => formatShort(counterValue.units[0], BigNumber(val)),
    [counterValue.units],
  );
  const displayCountervalue = countervalueFirst && countervalueAvailable;
  const AccountBalanceSummaryFooter = mainAccount
    ? perFamilyAccountBalanceSummaryFooter[mainAccount.currency.family]
    : null;
  const chartMagnitude = displayCountervalue
    ? counterValue.units[0].magnitude
    : getAccountUnit(account).magnitude;
  return (
    <Card p={0} py={5}>
      <Box px={6}>
        <AccountBalanceSummaryHeader
          account={account}
          counterValue={counterValue}
          countervalueChange={countervalueChange}
          cryptoChange={cryptoChange}
          last={history[history.length - 1]}
          isAvailable={countervalueAvailable}
          countervalueFirst={displayCountervalue}
          setCountervalueFirst={setCountervalueFirst}
        />
      </Box>

      <Box px={5} ff="Inter" fontSize={4} color="palette.text.shade80" pt={5}>
        <Chart
          magnitude={chartMagnitude}
          color={chartColor}
          // TODO we need to make Date non optional in live-common
          data={history}
          height={200}
          tickXScale={range}
          valueKey={displayCountervalue ? "countervalue" : "value"}
          renderTickY={
            discreetMode
              ? () => ""
              : displayCountervalue
              ? renderTickYCounterValue
              : renderTickYCryptoValue
          }
          renderTooltip={renderTooltip}
        />
      </Box>
      {AccountBalanceSummaryFooter && (
        <AccountBalanceSummaryFooter
          account={account}
          counterValue={counterValue}
          discreetMode={discreetMode}
        />
      )}
    </Card>
  );
}
