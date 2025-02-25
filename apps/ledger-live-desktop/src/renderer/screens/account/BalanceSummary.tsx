import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { useBalanceHistoryWithCountervalue, usePortfolio } from "~/renderer/actions/portfolio";
import { BigNumber } from "bignumber.js";
import { formatShort } from "@ledgerhq/live-common/currencies/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useTimeRange } from "~/renderer/actions/settings";
import { counterValueCurrencySelector, discreetModeSelector } from "~/renderer/reducers/settings";
import Chart, { GraphTrackingScreenName } from "~/renderer/components/Chart";
import Box, { Card } from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import AccountBalanceSummaryHeader from "./AccountBalanceSummaryHeader";
import { Data, Item } from "~/renderer/components/Chart/types";
import { getLLDCoinFamily } from "~/renderer/families";

import PlaceholderChart from "~/renderer/components/PlaceholderChart";
import Alert from "~/renderer/components/Alert";
import { useTranslation } from "react-i18next";
import { tokensWithUnsupportedGraph } from "~/helpers/tokensWithUnsupportedGraph";
import { hourFormat, dayFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

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
}: Props) {
  const { t } = useTranslation();
  const portfolio = usePortfolio();
  const [range] = useTimeRange();
  const counterValue = useSelector(counterValueCurrencySelector);
  const { history, countervalueAvailable, countervalueChange, cryptoChange } =
    useBalanceHistoryWithCountervalue({
      account,
      range,
    });
  const discreetMode = useSelector(discreetModeSelector);
  const dayFormatter = useDateFormatter(dayFormat);
  const hourFormatter = useDateFormatter(hourFormat);

  const unit = useAccountUnit(account);

  const renderTooltip = useCallback(
    (d: Item) => {
      const displayCountervalue = countervalueFirst && countervalueAvailable;

      const data = [
        {
          val: d.value,
          unit,
        },
        {
          val: Number(d.countervalue),
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
            {dayFormatter(d.date)}
          </Box>
          <Box ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
            {hourFormatter(d.date)}
          </Box>
        </>
      );
    },
    [
      counterValue.units,
      countervalueAvailable,
      countervalueFirst,
      dayFormatter,
      hourFormatter,
      unit,
    ],
  );
  const renderTickYCryptoValue = useCallback(
    (val: number | string) => {
      return formatShort(unit, BigNumber(val));
    },
    [unit],
  );
  const renderTickYCounterValue = useCallback(
    (val: number | string) => formatShort(counterValue.units[0], BigNumber(val)),
    [counterValue.units],
  );
  const displayCountervalue = countervalueFirst && countervalueAvailable;
  const AccountBalanceSummaryFooter = mainAccount
    ? getLLDCoinFamily(mainAccount.currency.family).AccountBalanceSummaryFooter
    : null;
  const chartMagnitude = displayCountervalue ? counterValue.units[0].magnitude : unit.magnitude;
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
        {account.type === "TokenAccount" &&
        tokensWithUnsupportedGraph.includes(account.token.id) ? (
          <>
            <Alert type="secondary" noIcon={false}>
              <span>{t("graph.noGraphWarning")}</span>
            </Alert>
            <PlaceholderChart
              magnitude={counterValue.units[0].magnitude}
              data={portfolio.balanceHistory}
              tickXScale={range}
            />
          </>
        ) : (
          <Chart
            magnitude={chartMagnitude}
            color={chartColor}
            // TODO we need to make Date non optional in live-common
            data={history as Data}
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
            screenName={GraphTrackingScreenName.Account}
          />
        )}
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
