import React, { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { BigNumber } from "bignumber.js";
import { formatShort } from "@ledgerhq/live-common/currencies/index";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { BalanceHistoryData, PortfolioRange } from "@ledgerhq/types-live";
import Chart, { GraphTrackingScreenName } from "~/renderer/components/Chart";
import Box, { Card } from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import PlaceholderChart from "~/renderer/components/PlaceholderChart";
import { discreetModeSelector } from "~/renderer/reducers/settings";
import BalanceInfos from "~/renderer/components/BalanceInfos";
import { usePortfolio } from "~/renderer/actions/portfolio";
import { hourFormat, dayFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
type Props = {
  counterValue: Currency;
  chartColor: string;
  range: PortfolioRange;
  isWallet40?: boolean;
  shouldDisplayGraphRework?: boolean;
};
export default function PortfolioBalanceSummary({
  range,
  chartColor,
  counterValue,
  isWallet40,
  shouldDisplayGraphRework,
}: Props) {
  const portfolio = usePortfolio();
  const discreetMode = useSelector(discreetModeSelector);
  const renderTickY = useCallback(
    (val: number | string) => formatShort(counterValue.units[0], BigNumber(val)),
    [counterValue],
  );

  const suggestedMin = Math.max(
    portfolio.balanceHistory.reduce((a, b) => (b.value < a ? b.value : a), Infinity),
    0,
  );
  const dayFormatter = useDateFormatter(dayFormat);
  const hourFormatter = useDateFormatter(hourFormat);
  const renderTooltip = useCallback(
    (data: BalanceHistoryData) => (
      <Tooltip
        data={data}
        counterValue={counterValue}
        dayFormatter={dayFormatter}
        hourFormatter={hourFormatter}
      />
    ),
    [counterValue, dayFormatter, hourFormatter],
  );
  const content = (
    <>
      <Box px={6}>
        <BalanceInfos
          counterValueId={counterValue.type !== "FiatCurrency" ? counterValue.id : undefined}
          unit={counterValue.units[0]}
          isAvailable={portfolio.balanceAvailable}
          valueChange={portfolio.countervalueChange}
          totalBalance={portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value}
          shouldDisplayGraphRework={shouldDisplayGraphRework}
        />
      </Box>

      <Box
        px={5}
        ff="Inter"
        fontSize={4}
        color="neutral.c80"
        pt={5}
        style={{
          overflow: "visible",
        }}
      >
        {portfolio.balanceAvailable ? (
          <Chart
            magnitude={counterValue.units[0].magnitude}
            color={chartColor}
            // TODO make date non optional
            data={portfolio.balanceHistory}
            height={250}
            tickXScale={range}
            renderTickY={discreetMode ? () => "" : renderTickY}
            renderTooltip={renderTooltip}
            suggestedMin={suggestedMin}
            screenName={GraphTrackingScreenName.Portfolio}
          />
        ) : (
          <PlaceholderChart
            magnitude={counterValue.units[0].magnitude}
            data={portfolio.balanceHistory}
            tickXScale={range}
          />
        )}
      </Box>
    </>
  );

  if (isWallet40) {
    return (
      <div className="flex flex-1 flex-col py-20" style={{ overflow: "visible" }}>
        {content}
      </div>
    );
  }

  return (
    <Card p={0} py={5} grow>
      {content}
    </Card>
  );
}
function Tooltip({
  data,
  counterValue,
  hourFormatter,
  dayFormatter,
}: {
  data: BalanceHistoryData;
  counterValue: Currency;
  dayFormatter: (date: Date) => string;
  hourFormatter: (date: Date) => string;
}) {
  return (
    <>
      <FormattedVal
        alwaysShowSign={false}
        fontSize={5}
        color="neutral.c100"
        showCode
        unit={counterValue.units[0]}
        val={data.value}
      />
      <Box ff="Inter|Regular" color="neutral.c70" fontSize={3} mt={2}>
        {dayFormatter(data.date)}
      </Box>
      <Box ff="Inter|Regular" color="neutral.c70" fontSize={3}>
        {hourFormatter(data.date)}
      </Box>
    </>
  );
}
