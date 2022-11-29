import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import {
  getAccountCurrency,
  getAccountUnit,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import { Currency } from "@ledgerhq/types-cryptoassets";
import {
  AccountLike,
  Account,
  BalanceHistoryWithCountervalue,
} from "@ledgerhq/types-live";
import Animated from "react-native-reanimated";
import Touchable from "../../components/Touchable";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import { track } from "../../analytics";
import AccountHeaderRight from "./AccountHeaderRight";
import CurrencyHeaderLayout from "../../components/CurrencyHeaderLayout";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Placeholder from "../../components/Placeholder";

function AccountHeader({
  currentPositionY,
  graphCardEndPosition,
  account,
  useCounterValue,
  counterValueCurrency,
  history,
  countervalueAvailable,
  parentAccount,
}: {
  currentPositionY: Animated.SharedValue<number>;
  graphCardEndPosition: number;
  account: AccountLike;
  useCounterValue?: boolean;
  counterValueCurrency: Currency;
  history: BalanceHistoryWithCountervalue;
  countervalueAvailable: boolean;
  parentAccount?: Account;
}) {
  const item = history[history.length - 1];
  const cryptoCurrencyUnit = getAccountUnit(account);
  const items = [
    {
      unit: cryptoCurrencyUnit,
      value: item.value,
    },
    {
      unit: counterValueCurrency.units[0],
      value: item.countervalue,
      joinFragmentsSeparator: "",
    },
  ];

  const shouldUseCounterValue = countervalueAvailable && useCounterValue;
  if (shouldUseCounterValue) {
    items.reverse();
  }

  const navigation = useNavigation();
  const currency = getAccountCurrency(account);

  const onBackButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      screen: "Account",
    });
    navigation.goBack();
  }, [navigation]);

  const isToken = parentAccount && parentAccount.name !== undefined;

  return (
    <CurrencyHeaderLayout
      currentPositionY={currentPositionY}
      graphCardEndPosition={graphCardEndPosition}
      leftElement={
        <Touchable onPress={onBackButtonPress}>
          <ArrowLeftMedium size={24} />
        </Touchable>
      }
      centerAfterScrollElement={
        <Flex flexDirection={"column"} alignItems={"center"}>
          {typeof items[1]?.value === "number" ? (
            <Flex flexDirection={"column"} alignItems={"center"}>
              <Text
                fontWeight={"semiBold"}
                color={"neutral.c70"}
                fontSize="11px"
                numberOfLines={1}
              >
                {getAccountName(account) +
                  (isToken ? ` - ${getAccountName(parentAccount)}` : "")}
              </Text>
              <Text
                variant={"small"}
                fontWeight={"semiBold"}
                color={"neutral.c100"}
                fontSize="18px"
                numberOfLines={1}
              >
                <CurrencyUnitValue {...items[0]} />
              </Text>
            </Flex>
          ) : (
            <>
              <Placeholder width={100} containerHeight={18} />
              <Placeholder width={150} containerHeight={28} />
            </>
          )}
        </Flex>
      }
      rightElement={<AccountHeaderRight />}
      currencyColor={getCurrencyColor(currency)}
    />
  );
}

export default withDiscreetMode(AccountHeader);
