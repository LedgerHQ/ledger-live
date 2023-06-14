import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { formatShort } from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency, Currency, TokenCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import Chart from "~/renderer/components/Chart";
import Box, { Card } from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import { useCurrencyPortfolio, usePortfolio } from "~/renderer/actions/portfolio";
import AssetBalanceSummaryHeader from "./AssetBalanceSummaryHeader";
import { discreetModeSelector } from "~/renderer/reducers/settings";
import FormattedDate from "~/renderer/components/FormattedDate";
import { Data } from "~/renderer/components/Chart/types";
import { PortfolioRange } from "@ledgerhq/types-live";
import PlaceholderChart from "~/renderer/components/PlaceholderChart";
import Alert from "~/renderer/components/Alert";
import { useTranslation } from "react-i18next";

type Props = {
  counterValue: Currency;
  chartColor: string;
  currency: CryptoCurrency | TokenCurrency;
  unit: Unit;
  range: PortfolioRange;
  countervalueFirst: boolean;
};
export default function BalanceSummary({
  unit,
  counterValue,
  countervalueFirst,
  range,
  chartColor,
  currency,
}: Props) {
  const { t } = useTranslation();
  const portfolio = usePortfolio();
  const { history, countervalueAvailable, countervalueChange, cryptoChange } = useCurrencyPortfolio(
    {
      currency,
      range,
    },
  );
  const discreetMode = useSelector(discreetModeSelector);

  const displayCountervalue = countervalueFirst && countervalueAvailable;
  const chartMagnitude = displayCountervalue ? counterValue.units[0].magnitude : unit.magnitude;
  const renderTooltip = useCallback(
    d => {
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
        </>
      );
    },
    [counterValue.units, countervalueAvailable, displayCountervalue, unit],
  );
  const renderTickYCryptoValue = useCallback(
    (val: number | string) => formatShort(unit, BigNumber(val)),
    [unit],
  );
  const renderTickYCounterValue = useCallback(
    (val: number | string) => formatShort(counterValue.units[0], BigNumber(val)),
    [counterValue.units],
  );
  return (
    <Card p={0} py={5}>
      <Box px={6}>
        <AssetBalanceSummaryHeader
          currency={currency}
          unit={unit}
          counterValue={counterValue}
          countervalueChange={countervalueChange}
          cryptoChange={cryptoChange}
          last={history[history.length - 1]}
          isAvailable={countervalueAvailable}
          countervalueFirst={displayCountervalue}
        />
      </Box>

      <Box px={5} ff="Inter" fontSize={4} color="palette.text.shade80" pt={6}>
        {currency.type === "TokenCurrency" && currency.id === "vechain/vtho" ? (
          <>
            <Alert type="secondary" noIcon={false}>
              <span>{t("vechain.noGraphWarning")}</span>
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
            // TODO make date non optional
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
          />
        )}
      </Box>
    </Card>
  );
}
