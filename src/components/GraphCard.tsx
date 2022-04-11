import React, { ReactNode, useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { Currency } from "@ledgerhq/live-common/lib/types";
import { Portfolio } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { BoxedIcon, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { PieChartMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";
import Delta from "./Delta";
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
  const { countervalueChange, balanceAvailable, balanceHistory } = portfolio;

  const item = balanceHistory[balanceHistory.length - 1];
  const navigation = useNavigation();

  const onPieChartButtonpress = useCallback(() => {
    navigation.navigate(NavigatorName.Analytics);
  }, [navigation]);

  const unit = counterValueCurrency.units[0];

  return (
    <Flex bg={"neutral.c30"} p={6} borderRadius={2}>
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
            {!balanceAvailable ? (
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
            {!balanceAvailable ? (
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
                <Delta
                  percent
                  valueChange={countervalueChange}
                  range={portfolio.range}
                />
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
    </Flex>
  );
}
