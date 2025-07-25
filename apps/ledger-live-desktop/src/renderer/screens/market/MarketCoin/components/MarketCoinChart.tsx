import React, { useMemo, memo, useCallback } from "react";
import { Flex, Text, Bar } from "@ledgerhq/react-ui";
import { SwitchTransition, Transition } from "react-transition-group";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import FormattedVal from "~/renderer/components/FormattedVal";
import styled from "styled-components";
import Chart, { GraphTrackingScreenName } from "~/renderer/components/Chart";
import { dayFormat, hourFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import ChartPlaceholder from "../../assets/ChartPlaceholder";
import CountervalueSelect from "../../components/CountervalueSelect";
import { useTranslation } from "react-i18next";
import { MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";
import { formatPercentage, formatPrice } from "../../utils";

const Title = styled(Text).attrs({ variant: "h3", color: "neutral.c100", mt: 1, mb: 5 })`
  font-size: 28px;
`;

const SubTitle = styled(Text).attrs({ variant: "large", color: "neutral.c80" })`
  font-size: 16px;
`;

const TooltipText = styled(Text).attrs({ variant: "body", color: "neutral.c100", mb: 1 })`
  font-size: 13px;
`;
const SubTooltipText = styled(Text).attrs({ variant: "small", color: "neutral.c60" })`
  font-size: 12px;
`;

const transitionStyles = {
  entering: { opacity: 1 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
};

const FadeIn = styled.div.attrs<{ state: string }>(p => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  style: transitionStyles[p.state as keyof typeof transitionStyles],
}))<{
  state: string;
}>`
  opacity: 0;
  transition: opacity 1s ease-out;
`;

const ranges = Object.keys(rangeDataTable)
  .filter(k => k !== "1h")
  .reverse();

type TooltipProps = {
  data: { date: Date; value: number };
  counterCurrency: string;
  locale: string;
  formatDay: (date: Date) => string;
  formatHour: (date: Date) => string;
};

function Tooltip({ data, counterCurrency, locale, formatDay, formatHour }: TooltipProps) {
  return (
    <Flex flexDirection="column" p={1}>
      <TooltipText variant="large">
        {counterValueFormatter({
          shorten: String(data.value).length > 7,
          currency: counterCurrency,
          value: data.value,
          locale,
        })}
      </TooltipText>
      <SubTooltipText>{formatDay(data.date)}</SubTooltipText>
      <SubTooltipText>{formatHour(data.date)}</SubTooltipText>
    </Flex>
  );
}

type Props = {
  price?: number;
  priceChangePercentage?: number;
  chartData?: MarketCoinDataChart;
  range: string;
  counterCurrency: string;
  refreshChart: (range: string) => void;
  color?: string;
  locale: string;
  loading: boolean;
  setCounterCurrency: (currency: string) => void;
  supportedCounterCurrencies?: string[];
};

function MarkeCoinChartComponent({
  chartData,
  price,
  priceChangePercentage,
  range,
  counterCurrency,
  refreshChart,
  color,
  locale,
  loading,
  setCounterCurrency,
  supportedCounterCurrencies,
}: Props) {
  const { t } = useTranslation();

  const { scale } = rangeDataTable[range] || { scale: undefined };
  const activeRangeIndex = ranges.indexOf(range);

  const data: { date: Date; value: number }[] = useMemo(() => {
    return chartData
      ? Object.values(chartData ?? [])[0].map(([date, value]) => ({
          date: new Date(date),
          value,
        }))
      : [];
  }, [chartData]);

  const setRange = useCallback(
    (index: number) => {
      const newRange = ranges[index];
      if (range !== newRange) refreshChart(newRange);
    },
    [refreshChart, range],
  );

  const valueArray = data.map(({ value }) => value);

  const suggestedMin = Math.min(...valueArray);
  const suggestedMax = Math.max(...valueArray);

  const formatDay = useDateFormatter(dayFormat);
  const formatHour = useDateFormatter(hourFormat);

  const renderTooltip = useCallback(
    (data: { value: number; date: Date }) =>
      !loading &&
      counterCurrency && (
        <Tooltip
          data={data}
          counterCurrency={counterCurrency.toUpperCase()}
          locale={locale}
          formatDay={formatDay}
          formatHour={formatHour}
        />
      ),
    [counterCurrency, loading, locale, formatDay, formatHour],
  );

  return (
    <Flex py={6} flexDirection="column" alignContent="stretch">
      <Flex mb={2} flexDirection="row" justifyContent="space-between" alignItems="flex-end">
        <Flex flexDirection="column">
          <SubTitle>{t("market.marketList.price")}</SubTitle>
          <Title data-testid={"market-price"}>
            {counterValueFormatter({
              currency: counterCurrency,
              value: formatPrice(price ?? 0),
              locale,
            })}
          </Title>
          <Flex data-testid={"market-price-delta"}>
            {priceChangePercentage && (
              <FormattedVal
                isPercent
                isNegative
                val={formatPercentage(priceChangePercentage)}
                inline
                withIcon
              />
            )}
          </Flex>
        </Flex>
        <Flex flexDirection="column" justifyContent="space-between">
          <Flex mb={3}>
            <CountervalueSelect
              data-testid="market-coin-counter-value-select"
              counterCurrency={counterCurrency}
              setCounterCurrency={setCounterCurrency}
              supportedCounterCurrencies={supportedCounterCurrencies}
            />
          </Flex>
          <Bar
            data-testid="market-coin-range-select"
            onTabChange={setRange}
            initialActiveIndex={activeRangeIndex}
          >
            {ranges.map(key => (
              <Text color="inherit" variant="small" key={key}>
                {t(`market.range.${rangeDataTable[key].label}`)}
              </Text>
            ))}
          </Bar>
        </Flex>
      </Flex>
      <SwitchTransition>
        <Transition
          key={loading || !data.length ? "loading" : "ready"}
          timeout={200}
          unmountOnExit
          mountOnEnter
        >
          {state => (
            <FadeIn state={state}>
              {loading || !data.length ? (
                <Flex height={250} color="neutral.c60">
                  <ChartPlaceholder />
                </Flex>
              ) : (
                <Chart
                  magnitude={1}
                  color={color}
                  data={data}
                  height={250}
                  tickXScale={scale}
                  renderTickY={value =>
                    counterValueFormatter({
                      value: typeof value === "string" ? parseInt(value) : value,
                      shorten: String(value).length > 7,
                      locale,
                    }) || ""
                  }
                  renderTooltip={renderTooltip}
                  suggestedMin={suggestedMin}
                  suggestedMax={suggestedMax}
                  key={2}
                  screenName={GraphTrackingScreenName.Market}
                />
              )}
            </FadeIn>
          )}
        </Transition>
      </SwitchTransition>
    </Flex>
  );
}

export default memo<Props>(MarkeCoinChartComponent);
