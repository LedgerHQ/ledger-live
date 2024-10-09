import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { formatShort } from "@ledgerhq/live-common/currencies/index";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { BalanceHistoryData, PortfolioRange } from "@ledgerhq/types-live";
import Chart from "~/renderer/components/Chart";
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
};
export default function PortfolioBalanceSummary({ range, chartColor, counterValue }: Props) {
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
  return (
    <Card p={0} py={5} grow>
      <Box px={6}>
        <BalanceInfos
          counterValueId={counterValue.type !== "FiatCurrency" ? counterValue.id : undefined}
          unit={counterValue.units[0]}
          isAvailable={portfolio.balanceAvailable}
          valueChange={portfolio.countervalueChange}
          totalBalance={portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value}
        />
      </Box>

      <Box
        px={5}
        ff="Inter"
        fontSize={4}
        color="palette.text.shade80"
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
          />
        ) : (
          <PlaceholderChart
            magnitude={counterValue.units[0].magnitude}
            data={portfolio.balanceHistory}
            tickXScale={range}
          />
        )}
      </Box>
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
        color="palette.text.shade100"
        showCode
        unit={counterValue.units[0]}
        val={data.value}
      />
      <Box ff="Inter|Regular" color="palette.text.shade60" fontSize={3} mt={2}>
        {dayFormatter(data.date)}
      </Box>
      <Box ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
        {hourFormatter(data.date)}
      </Box>
    </>
  );
}
