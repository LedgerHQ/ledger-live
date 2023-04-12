import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Currency, FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";
import {
  ArrowLeftMedium,
  SettingsMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import BigNumber from "bignumber.js";
import Touchable from "../../components/Touchable";
import { ScreenName } from "../../const";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import {
  countervalueFirstSelector,
  readOnlyModeEnabledSelector,
} from "../../reducers/settings";
import { track } from "../../analytics";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Placeholder from "../../components/Placeholder";
import CurrencyHeaderLayout from "../../components/CurrencyHeaderLayout";
import CounterValue from "../../components/CounterValue";

function Header({
  currentPositionY,
  graphCardEndPosition,
  currency,
  currencyBalance,
}: {
  currentPositionY: Animated.SharedValue<number>;
  graphCardEndPosition: number;
  currency: Currency;
  currencyBalance: BigNumber;
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const shouldUseCounterValue = useSelector(countervalueFirstSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const onBackButtonPress = useCallback(() => {
    if (readOnlyModeEnabled) {
      track("button_clicked", {
        button: "Back",
        screen: "Account",
      });
    }
    navigation.goBack();
  }, [navigation, readOnlyModeEnabled]);

  const goToSettings = useCallback(() => {
    track("button_clicked", {
      button: "Asset settings",
    });
    navigation.navigate(ScreenName.CurrencySettings, {
      currencyId: (currency as Exclude<Currency, FiatCurrency>).id,
    });
  }, [currency, navigation]);

  return (
    <CurrencyHeaderLayout
      currentPositionY={currentPositionY}
      graphCardEndPosition={graphCardEndPosition}
      leftElement={
        <Touchable onPress={onBackButtonPress}>
          <ArrowLeftMedium size={24} />
        </Touchable>
      }
      centerBeforeScrollElement={
        <Flex flexDirection={"row"} alignItems={"center"}>
          <Text
            variant={"large"}
            fontWeight={"semiBold"}
            numberOfLines={1}
            testID={`accounts-title-${currency.name}`}
          >
            {t("asset.title", { assetName: currency.name })}
          </Text>
        </Flex>
      }
      centerAfterScrollElement={
        <Flex flexDirection={"column"} alignItems={"center"}>
          {currencyBalance ? (
            <>
              <Text
                variant={"small"}
                fontWeight={"semiBold"}
                color={"neutral.c70"}
                fontSize="11px"
                numberOfLines={1}
              >
                {t("asset.title", { assetName: currency.name })}
              </Text>
              <Text
                variant={"small"}
                fontWeight={"semiBold"}
                color={"neutral.c100"}
                fontSize="18px"
                numberOfLines={1}
              >
                {shouldUseCounterValue ? (
                  <CounterValue currency={currency} value={currencyBalance} />
                ) : (
                  <CurrencyUnitValue
                    showCode
                    unit={currency.units[0]}
                    value={currencyBalance}
                  />
                )}
              </Text>
            </>
          ) : (
            <>
              <Placeholder width={100} containerHeight={18} />
              <Placeholder width={150} containerHeight={28} />
            </>
          )}
        </Flex>
      }
      rightElement={
        currency.type !== "TokenCurrency" ? (
          <Touchable onPress={goToSettings}>
            <SettingsMedium size={24} />
          </Touchable>
        ) : null
      }
      currencyColor={getCurrencyColor(currency)}
    />
  );
}

export default React.memo(withDiscreetMode(Header));
