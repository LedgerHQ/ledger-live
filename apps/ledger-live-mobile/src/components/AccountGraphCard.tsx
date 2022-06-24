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
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
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
import CurrencyUnitValue from "./CurrencyUnitValue";
import { Item } from "./Graph/types";
import { useBalanceHistoryWithCountervalue } from "../actions/portfolio";
import getWindowDimensions from "../logic/getWindowDimensions";
import Graph from "./Graph";
import Touchable from "./Touchable";
import TransactionsPendingConfirmationWarning from "./TransactionsPendingConfirmationWarning";
import { NoCountervaluePlaceholder } from "./CounterValue";
import DiscreetModeButton from "./DiscreetModeButton";

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
  onSwitchAccountCurrency: () => void;
};

const timeRangeMapped: any = {
  all: "all",
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
  onSwitchAccountCurrency,
  valueChange,
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
        label: t(`common:time.${timeRangeMapped[r]}`),
        value: timeRangeMapped[r],
      })),
    [t],
  );

  const rangesLabels = ranges.map(({ label }) => label);

  const activeRangeIndex = ranges.findIndex(r => r.value === timeRange);

  const isAvailable = !useCounterValue || countervalueAvailable;

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

  const mapCryptoValue = useCallback(d => d.value || 0, []);
  const mapCounterValue = useCallback(
    d => (d.countervalue ? d.countervalue : 0),
    [],
  );

  return (
    <Flex
      flexDirection="column"
      bg="neutral.c30"
      mt={20}
      py={6}
      borderRadius={8}
    >
      <GraphCardHeader
        account={account}
        countervalueAvailable={countervalueAvailable}
        onSwitchAccountCurrency={onSwitchAccountCurrency}
        countervalueChange={countervalueChange}
        counterValueUnit={counterValueCurrency.units[0]}
        useCounterValue={useCounterValue}
        cryptoCurrencyUnit={getAccountUnit(account)}
        item={hoveredItem || history[history.length - 1]}
        valueChange={valueChange}
      />
      <Flex height={120} alignItems="center" justifyContent="center">
        {!loading ? (
          <Transitions.Fade duration={400} status="entering">
            {/** @ts-expect-error import js issue */}
            <Graph
              isInteractive
              isLoading={!isAvailable}
              height={120}
              width={width - 32}
              color={colors.primary.c80}
              data={history}
              mapValue={useCounterValue ? mapCounterValue : mapCryptoValue}
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
          activeBg="background.main"
          onChange={updateRange}
          labels={rangesLabels}
        />
      </Flex>
      <Footer renderAccountSummary={renderAccountSummary} />
    </Flex>
  );
}

type HeaderTitleProps = {
  account: AccountLike;
  countervalueAvailable: boolean;
  onSwitchAccountCurrency: () => void;
  valueChange: ValueChange;
  useCounterValue?: boolean;
  cryptoCurrencyUnit: Unit;
  counterValueUnit: Unit;
  item: Item;
};

const GraphCardHeader = ({
  account,
  countervalueAvailable,
  onSwitchAccountCurrency,
  valueChange,
  useCounterValue,
  cryptoCurrencyUnit,
  counterValueUnit,
  item,
}: HeaderTitleProps) => {
  const items = [
    {
      unit: cryptoCurrencyUnit,
      value: item.value,
    },
    {
      unit: counterValueUnit,
      value: item.countervalue,
      joinFragmentsSeparator: " ",
    },
  ];

  const shouldUseCounterValue = countervalueAvailable && useCounterValue;
  if (shouldUseCounterValue) {
    items.reverse();
  }

  return (
    <Flex flexDirection={"row"} px={6} justifyContent={"space-between"}>
      <Touchable
        event="SwitchAccountCurrency"
        eventProperties={{ useCounterValue: shouldUseCounterValue }}
        onPress={countervalueAvailable ? onSwitchAccountCurrency : undefined}
        style={{ flexShrink: 1 }}
      >
        <Flex>
          <Flex flexDirection={"row"}>
            <Text variant={"large"} fontWeight={"medium"} color={"neutral.c70"}>
              {typeof items[1]?.value === "number" ? (
                <CurrencyUnitValue {...items[1]} />
              ) : (
                <NoCountervaluePlaceholder />
              )}
            </Text>
            <TransactionsPendingConfirmationWarning maybeAccount={account} />
          </Flex>
          <Text
            fontFamily="Inter"
            fontWeight="semiBold"
            fontSize="30px"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            <CurrencyUnitValue
              disableRounding={shouldUseCounterValue}
              {...items[0]}
            />
          </Text>
          <Flex flexDirection="row" alignItems="center">
            <Delta percent valueChange={valueChange} />
            <Flex ml={2}>
              <Delta unit={items[0].unit} valueChange={valueChange} />
            </Flex>
          </Flex>
        </Flex>
      </Touchable>
      <Flex justifyContent={"flex-start"} ml={4}>
        <DiscreetModeButton />
      </Flex>
    </Flex>
  );
};

export default memo(AccountGraphCard);
