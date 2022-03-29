import React, {
  useState,
  useCallback,
  useMemo,
  ReactNode,
  memo,
  useEffect,
} from "react";
import { useTheme } from "styled-components/native";
import { Unit, Currency, AccountLike } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import {
  ValueChange,
  PortfolioRange,
  BalanceHistoryWithCountervalue,
} from "@ledgerhq/live-common/lib/portfolio/v2/types";
import {
  Box,
  Flex,
  Text,
  Transitions,
  InfiniteLoader,
  GraphTabs,
} from "@ledgerhq/native-ui";

import { useTranslation } from "react-i18next";
import { useTimeRange } from "../actions/settings";
import Delta from "./Delta";
import FormatDate from "./FormatDate";
import CurrencyUnitValue from "./CurrencyUnitValue";
import Placeholder from "./Placeholder";
import { Item } from "./Graph/types";
import CurrencyRate from "./CurrencyRate";
import { useBalanceHistoryWithCountervalue } from "../actions/portfolio";
import getWindowDimensions from "../logic/getWindowDimensions";
import Graph from "./Graph";

const { width } = getWindowDimensions();

type FooterProps = {
  renderAccountSummary: () => ReactNode;
};

const Footer = ({ renderAccountSummary }: FooterProps) => {
  const accountSummary = renderAccountSummary && renderAccountSummary();
  return accountSummary ? (
    <Box
      flexDirection={"row"}
      alignItemps={"center"}
      marginTop={5}
      overflow={"hidden"}
    >
      {accountSummary}
    </Box>
  ) : null;
};

type Props = {
  account: AccountLike;
  range: PortfolioRange;
  history: BalanceHistoryWithCountervalue;
  valueChange: ValueChange;
  countervalueAvailable: boolean;
  counterValueCurrency: Currency;
  useCounterValue?: boolean;
  renderAccountSummary: () => ReactNode;
};

const timeRangeMapped: any = {
  "1y": "year",
  "30d": "month",
  "7d": "week",
  "24h": "day",
};

function AccountGraphCard({
  account,
  countervalueAvailable,
  history,
  counterValueCurrency,
  useCounterValue,
  renderAccountSummary,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [timeRange, setTimeRange] = useTimeRange();
  const [loading, setLoading] = useState(false);
  const { countervalueChange } = useBalanceHistoryWithCountervalue({
    account,
    range: timeRange,
  });

  const ranges = useMemo(
    () =>
      Object.keys(timeRangeMapped).map(r => ({
        label: t(`market.range.${r}`),
        value: timeRangeMapped[r],
      })),
    [t],
  );

  const rangesLabels = ranges.map(({ label }) => label);

  const activeRangeIndex = ranges.findIndex(r => r.value === timeRange);

  const isAvailable = !useCounterValue || countervalueAvailable;
  const unit = getAccountUnit(account);

  const updateRange = useCallback(
    index => {
      if (ranges[index]) {
        const range: PortfolioRange = ranges[index].value;
        setLoading(true);
        setTimeRange(range);
      }
    },
    [ranges, setTimeRange],
  );

  useEffect(() => {
    if (history && history.length > 0) {
      setLoading(false);
    }
  }, [history]);

  const [hoveredItem, setHoverItem] = useState<Item>();

  const mapGraphValue = useCallback(d => d?.value || 0, []);

  return (
    <Flex
      flexDirection="column"
      mt={20}
      bg="neutral.c30"
      py={6}
      borderRadius={8}
    >
      <GraphCardHeader
        account={account}
        isLoading={!isAvailable}
        to={history[history.length - 1]}
        cryptoCurrencyUnit={unit}
        counterValueUnit={counterValueCurrency.units[0]}
        useCounterValue={useCounterValue}
        valueChange={countervalueChange}
        hoveredItem={hoveredItem}
      />
      <Flex height={120} alignItems="center" justifyContent="center">
        {!loading ? (
          <Transitions.Fade duration={400} status="entering">
            {/** @ts-expect-error import js issue */}
            <Graph
              isInteractive
              isLoading={!isAvailable}
              height={100}
              width={width - 32}
              color={colors.primary.c80}
              data={history}
              mapValue={mapGraphValue}
              onItemHover={setHoverItem}
              verticalRangeRatio={10}
            />
          </Transitions.Fade>
        ) : (
          <InfiniteLoader size={32} />
        )}
      </Flex>
      <Flex mt={25} px={6}>
        <GraphTabs
          activeIndex={activeRangeIndex}
          activeBg="neutral.c20"
          onChange={updateRange}
          labels={rangesLabels}
        />
      </Flex>
      <Footer renderAccountSummary={renderAccountSummary} />
    </Flex>
  );
}

function GraphCardHeader({
  counterValueUnit,
  to,
  hoveredItem,
  isLoading,
  valueChange,
  account,
}: {
  account: AccountLike;
  isLoading: boolean;
  cryptoCurrencyUnit: Unit;
  counterValueUnit: Unit;
  to: Item;
  hoveredItem?: Item;
  useCounterValue?: boolean;
  valueChange: ValueChange;
}) {
  const currency = getAccountCurrency(account);
  const item = hoveredItem || to;

  return (
    <Flex
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      px={6}
    >
      <Box flexShrink={1}>
        {hoveredItem ? (
          <Text
            variant={"body"}
            fontWeight={"semiBold"}
            color="neutral.c100"
            numberOfLines={1}
            mr={4}
          >
            <CurrencyUnitValue
              unit={counterValueUnit}
              value={item.countervalue}
            />
          </Text>
        ) : (
          <CurrencyRate currency={currency} />
        )}
      </Box>
      <Box>
        {isLoading ? (
          <Placeholder
            width={50}
            containerHeight={19}
            style={{ marginRight: 10 }}
          />
        ) : hoveredItem && hoveredItem.date ? (
          <Text variant={"body"} fontWeight={"medium"}>
            <FormatDate date={hoveredItem.date} />
          </Text>
        ) : valueChange ? (
          <Delta percent valueChange={valueChange} />
        ) : null}
      </Box>
    </Flex>
  );
}

export default memo(AccountGraphCard);
