import React, { ReactNode, useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { Currency, Unit } from "@ledgerhq/live-common/lib/types";
import {
  Portfolio,
  PortfolioRange,
  ValueChange,
} from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { BoxedIcon, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { PieChartMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";
import Delta from "./Delta";
import { Item } from "./Graph/types";
import TransactionsPendingConfirmationWarning from "./TransactionsPendingConfirmationWarning";
import CurrencyUnitValue from "./CurrencyUnitValue";
import Placeholder from "./Placeholder";
import DiscreetModeButton from "./DiscreetModeButton";
import { NavigatorName } from "../const";

type Props = {
  portfolio: Portfolio;
  counterValueCurrency: Currency;
  useCounterValue?: boolean;
  renderTitle?: ({ counterValueUnit: Unit, item: Item }) => ReactNode;
};

export default function GraphCard({
  portfolio,
  renderTitle,
  counterValueCurrency,
}: Props) {
  const { countervalueChange } = portfolio;

  const isAvailable = portfolio.balanceAvailable;
  const balanceHistory = portfolio.balanceHistory;

  return (
    <Flex bg={"neutral.c30"} p={6} borderRadius={2}>
      <GraphCardHeader
        valueChange={countervalueChange}
        isLoading={!isAvailable}
        to={balanceHistory[balanceHistory.length - 1]}
        unit={counterValueCurrency.units[0]}
        range={portfolio.range}
        renderTitle={renderTitle}
      />
    </Flex>
  );
}

function GraphCardHeader({
  unit,
  valueChange,
  range,
  renderTitle,
  isLoading,
  to,
}: {
  isLoading: boolean;
  valueChange: ValueChange;
  unit: Unit;
  to: Item;
  range?: PortfolioRange;
  renderTitle?: ({ counterValueUnit: Unit, item: Item }) => ReactNode;
}) {
  const item = to;
  const navigation = useNavigation();

  const onPieChartButtonpress = useCallback(() => {
    navigation.navigate(NavigatorName.Analytics);
  }, [navigation]);

  return (
    <Flex
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
    >
      <Flex>
        <Flex flexDirection={"row"} alignItems={"center"} mb={1}>
          <Text
            variant={"small"}
            fontWeight={"semiBold"}
            color={"neutral.c70"}
            textTransform={"uppercase"}
            mr={2}
          >
            <Trans i18nKey={"tabs.portfolio"} />
          </Text>
          <DiscreetModeButton size={20} />
        </Flex>

        <View>
          {isLoading ? (
            <Placeholder width={228} containerHeight={27} />
          ) : renderTitle ? (
            renderTitle({ counterValueUnit: unit, item })
          ) : (
            <Text variant={"h1"} color={"neutral.c100"}>
              <CurrencyUnitValue unit={unit} value={item.value} />
            </Text>
          )}
          <TransactionsPendingConfirmationWarning />
        </View>
        <Flex flexDirection={"row"}>
          {isLoading ? (
            <>
              <Placeholder
                width={50}
                containerHeight={19}
                style={{ marginRight: 10 }}
              />
              <Placeholder width={50} containerHeight={19} />
            </>
          ) : (
            <View>
              <Delta percent valueChange={valueChange} range={range} />
            </View>
          )}
        </Flex>
      </Flex>
      <Flex>
        <TouchableOpacity onPress={onPieChartButtonpress}>
          <BoxedIcon
            Icon={PieChartMedium}
            variant={"circle"}
            iconSize={20}
            size={48}
            badgeSize={30}
            iconColor={"neutral.c100"}
          />
        </TouchableOpacity>
      </Flex>
    </Flex>
  );
}
