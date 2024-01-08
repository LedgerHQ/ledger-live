import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CryptoOrTokenCurrency, Currency, FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";
import { ArrowLeftMedium, SettingsMedium } from "@ledgerhq/native-ui/assets/icons";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import BigNumber from "bignumber.js";
import Touchable from "~/components/Touchable";
import { ScreenName } from "~/const";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { countervalueFirstSelector, readOnlyModeEnabledSelector } from "~/reducers/settings";
import { track } from "~/analytics";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Placeholder from "~/components/Placeholder";
import CurrencyHeaderLayout from "~/components/CurrencyHeaderLayout";
import CounterValue from "~/components/CounterValue";
import { WalletConnectAction } from "./WalletConnectHeader";
import { isWalletConnectSupported } from "@ledgerhq/live-common/walletConnect/index";

type LeftProps = {
  onBackButtonPress: () => void;
  displayWalletConnectAction: boolean;
};

function HeaderLeft({ onBackButtonPress, displayWalletConnectAction }: LeftProps) {
  return (
    <Flex flexDirection="row">
      <Touchable onPress={onBackButtonPress}>
        <ArrowLeftMedium size={24} />
      </Touchable>
      {displayWalletConnectAction && <Flex ml={7} width={24} />}
    </Flex>
  );
}

type RightProps = {
  currency: Currency;
  onSettingsButtonPress: () => void;
  displayWalletConnectAction: boolean;
};

function HeaderRight({ currency, displayWalletConnectAction, onSettingsButtonPress }: RightProps) {
  return currency.type !== "TokenCurrency" ? (
    <Flex flexDirection="row">
      {displayWalletConnectAction && (
        <Flex mr={7}>
          <WalletConnectAction
            currency={currency as CryptoOrTokenCurrency}
            event="WalletConnect Asset Button"
          />
        </Flex>
      )}

      <Touchable onPress={onSettingsButtonPress}>
        <SettingsMedium size={24} />
      </Touchable>
    </Flex>
  ) : null;
}

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
  const isWalletConnectActionDisplayable = isWalletConnectSupported(
    currency as CryptoOrTokenCurrency,
  );

  const onBackButtonPress = useCallback(() => {
    if (readOnlyModeEnabled) {
      track("button_clicked", {
        button: "Back",
        page: "Account",
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
        <HeaderLeft
          onBackButtonPress={onBackButtonPress}
          displayWalletConnectAction={isWalletConnectActionDisplayable}
        />
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
                  <CurrencyUnitValue showCode unit={currency.units[0]} value={currencyBalance} />
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
        <HeaderRight
          currency={currency}
          onSettingsButtonPress={goToSettings}
          displayWalletConnectAction={isWalletConnectActionDisplayable}
        />
      }
      currencyColor={getCurrencyColor(currency)}
    />
  );
}

export default React.memo(withDiscreetMode(Header));
