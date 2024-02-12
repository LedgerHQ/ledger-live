import React, { useState, useCallback, useMemo, ReactNode, memo, useEffect } from "react";
import { useTheme } from "styled-components/native";
import {
  AccountLike,
  Account,
  ValueChange,
  PortfolioRange,
  BalanceHistoryWithCountervalue,
} from "@ledgerhq/types-live";
import { Unit, Currency } from "@ledgerhq/types-cryptoassets";
import {
  getAccountCurrency,
  getAccountUnit,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import { Box, Flex, Text, Transitions, InfiniteLoader, GraphTabs, Tag } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { QrCodeMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";
import { useTimeRange } from "~/actions/settings";
import Delta from "./Delta";
import CurrencyUnitValue, { CurrencyUnitValueProps } from "./CurrencyUnitValue";
import { Item } from "./Graph/types";
import getWindowDimensions from "~/logic/getWindowDimensions";
import Graph from "./Graph";
import Touchable from "./Touchable";
import { TransactionsPendingConfirmationWarningForAccount } from "./TransactionsPendingConfirmationWarning";
import { NoCountervaluePlaceholder } from "./CounterValue";
import { ensureContrast } from "../colors";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { StackNavigatorNavigation } from "./RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "./RootNavigator/types/BaseNavigator";
import { GraphPlaceholder } from "./Graph/Placeholder";
import { tokensWithUnsupportedGraph } from "./Graph/tokensWithUnsupportedGraph";

const { width } = getWindowDimensions();

type FooterProps = {
  renderAccountSummary?: () => ReactNode;
};

const Footer = ({ renderAccountSummary }: FooterProps) => {
  const accountSummary = renderAccountSummary && renderAccountSummary();
  return accountSummary ? (
    <Box flexDirection={"row"} alignItems={"center"} marginTop={5} overflow={"hidden"}>
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
  renderAccountSummary?: () => ReactNode;
  onSwitchAccountCurrency: () => void;
  parentAccount?: Account;
};

const timeRangeMapped = {
  "24h": "day",
  "7d": "week",
  "30d": "month",
  "1y": "year",
  all: "all",
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
  parentAccount,
}: Props) {
  const currency = getAccountCurrency(account);

  const { colors } = useTheme();
  const { t } = useTranslation();

  const [timeRange, setTimeRange] = useTimeRange();
  const [loading, setLoading] = useState(false);

  const ranges = useMemo(
    () =>
      Object.values(timeRangeMapped).map(value => ({
        label: t(`common:time.${value}`),
        value,
      })),
    [t],
  );

  const rangesLabels = ranges.map(({ label }) => label);

  const activeRangeIndex = ranges.findIndex(r => r.value === timeRange);

  const updateRange = useCallback(
    (index: number) => {
      if (ranges[index]) {
        const range = ranges[index].value as PortfolioRange;
        track("timeframe_clicked", { timeframe: range });
        setLoading(true);
        setTimeRange(range);
      }
    },
    [ranges, setTimeRange],
  );

  const handleGraphTouch = useCallback(() => {
    track("graph_clicked", {
      graph: "Account Graph",
      timeframe: timeRange,
    });
  }, [timeRange]);

  useEffect(() => {
    if (history && history.length > 0) {
      setLoading(false);
    }
  }, [history]);

  const [hoveredItem, setHoverItem] = useState<Item | null>();

  const mapCryptoValue = useCallback((d: Item) => d.value || 0, []);
  const mapCounterValue = useCallback(
    (d: Item) => (d && "countervalue" in d ? d.countervalue : 0),
    [],
  );

  const graphColor = ensureContrast(getCurrencyColor(currency), colors.background.main);

  return (
    <Flex mt={2}>
      <GraphCardHeader
        account={account}
        countervalueAvailable={countervalueAvailable}
        onSwitchAccountCurrency={onSwitchAccountCurrency}
        counterValueUnit={counterValueCurrency.units[0]}
        useCounterValue={useCounterValue}
        cryptoCurrencyUnit={getAccountUnit(account)}
        item={hoveredItem || history[history.length - 1]}
        valueChange={valueChange}
        parentAccount={parentAccount}
        currency={currency}
      />
      {account.type === "TokenAccount" && tokensWithUnsupportedGraph.includes(account.token.id) ? (
        <GraphPlaceholder />
      ) : (
        <>
          <Flex
            height={120}
            alignItems="center"
            justifyContent="center"
            onTouchEnd={handleGraphTouch}
          >
            {!loading ? (
              <Transitions.Fade duration={400} status="entering">
                <Graph
                  isInteractive
                  height={120}
                  width={width}
                  color={graphColor}
                  data={history}
                  mapValue={useCounterValue ? mapCounterValue : mapCryptoValue}
                  onItemHover={setHoverItem}
                  verticalRangeRatio={10}
                  fill={colors.background.main}
                />
              </Transitions.Fade>
            ) : (
              <InfiniteLoader size={32} />
            )}
          </Flex>
          <Flex bg="background.main">
            <GraphTabs
              activeIndex={activeRangeIndex}
              onChange={updateRange}
              labels={rangesLabels}
            />
          </Flex>
        </>
      )}
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
  parentAccount?: Account;
  currency: Currency;
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
  parentAccount,
  currency,
}: HeaderTitleProps) => {
  const items: CurrencyUnitValueProps[] = [
    {
      unit: cryptoCurrencyUnit,
      value: item.value,
      dynamicSignificantDigits: 8,
    },
    {
      unit: counterValueUnit,
      value: (item as { countervalue: number }).countervalue,
      joinFragmentsSeparator: "",
    },
  ];

  const shouldUseCounterValue = countervalueAvailable && useCounterValue;
  if (shouldUseCounterValue) {
    items.reverse();
  }
  const isToken = parentAccount && parentAccount.name !== undefined;

  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const openReceive = useCallback(() => {
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        accountId: account.id,
        parentId: parentAccount?.id,
        currency,
      },
    });
  }, [account.id, currency, navigation, parentAccount?.id]);

  return (
    <Flex mx={6}>
      <Touchable
        event="SwitchAccountCurrency"
        eventProperties={{ useCounterValue: shouldUseCounterValue }}
        onPress={countervalueAvailable ? onSwitchAccountCurrency : undefined}
      >
        <Flex flexDirection="row" alignItems="center" width="100%">
          <Box maxWidth={"50%"}>
            <Text variant={"large"} fontWeight={"medium"} numberOfLines={1}>
              {getAccountName(account)}
            </Text>
          </Box>
          {isToken && (
            <Tag marginLeft={3} numberOfLines={1} maxWidth={"50%"}>
              {getAccountName(parentAccount)}
            </Tag>
          )}
        </Flex>

        <Flex flexDirection="row" mb={4}>
          <Text variant={"large"} fontWeight={"medium"} color={"neutral.c70"} numberOfLines={1}>
            {typeof items[1]?.value === "number" ? (
              <CurrencyUnitValue {...items[1]} />
            ) : (
              <NoCountervaluePlaceholder />
            )}
          </Text>
          <TransactionsPendingConfirmationWarningForAccount maybeAccount={account} />
        </Flex>
        <Text
          fontFamily="Inter"
          fontWeight="semiBold"
          fontSize="32px"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          <CurrencyUnitValue {...items[0]} />
        </Text>
        <Flex flexDirection="row" alignItems="center">
          <Delta percent show0Delta valueChange={valueChange} />
          <Flex ml={2}>
            <Delta unit={items[0].unit} valueChange={valueChange} />
          </Flex>
        </Flex>
      </Touchable>
      <Touchable onPress={openReceive}>
        <Tag
          Icon={QrCodeMedium}
          numberOfLines={1}
          maxWidth={"50%"}
          size="medium"
          ellipsizeMode="middle"
          px={6}
          mt={4}
        >
          {isToken ? parentAccount.freshAddress : (account as Account).freshAddress}
        </Tag>
      </Touchable>
    </Flex>
  );
};

export default memo(AccountGraphCard);
