import React, { ReactNode, useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { Currency } from "@ledgerhq/live-common/lib/types";
import { Portfolio } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { BoxedIcon, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { PieChartMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";
import styled from "styled-components/native";
import Delta from "./Delta";
import TransactionsPendingConfirmationWarning from "./TransactionsPendingConfirmationWarning";
import CurrencyUnitValue from "./CurrencyUnitValue";
import DiscreetModeButton from "./DiscreetModeButton";
import { NavigatorName } from "../const";

type Props = {
  areAccountsEmpty: boolean;
  portfolio: Portfolio;
  counterValueCurrency: Currency;
  useCounterValue?: boolean;
};

const Placeholder = styled(Flex).attrs({
  backgroundColor: "neutral.c40",
  borderRadius: "4px",
})``;
const BigPlaceholder = styled(Placeholder).attrs({
  width: 189,
  height: 18,
})``;

const SmallPlaceholder = styled(Placeholder).attrs({
  width: 109,
  height: 8,
  borderRadius: "2px",
})``;

export default function GraphCard({
  portfolio,
  counterValueCurrency,
  areAccountsEmpty,
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
            {!areAccountsEmpty && <DiscreetModeButton size={20} />}
          </Flex>
          {areAccountsEmpty ? (
            <Text variant={"h1"} color={"neutral.c100"}>
              <CurrencyUnitValue unit={unit} value={0} />
            </Text>
          ) : (
            <>
              <Flex>
                {!balanceAvailable ? (
                  <BigPlaceholder mt="8px" />
                ) : (
                  <Text variant={"h1"} color={"neutral.c100"}>
                    <CurrencyUnitValue unit={unit} value={item.value} />
                  </Text>
                )}
                <TransactionsPendingConfirmationWarning />
              </Flex>
              <Flex flexDirection={"row"}>
                {!balanceAvailable ? (
                  <>
                    <SmallPlaceholder mt="12px" />
                  </>
                ) : (
                  <View>
                    <Delta
                      percent
                      show0Delta
                      valueChange={countervalueChange}
                      range={portfolio.range}
                    />
                  </View>
                )}
              </Flex>
            </>
          )}
        </Flex>
        {!areAccountsEmpty ? (
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
        ) : null}
      </Flex>
    </Flex>
  );
}
