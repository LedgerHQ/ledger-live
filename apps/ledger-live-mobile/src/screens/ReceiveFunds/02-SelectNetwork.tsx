import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, FlatList, Linking } from "react-native";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  isCurrencySupported,
  listTokens,
  useCurrenciesByMarketcap,
  listSupportedCurrencies,
  findCryptoCurrencyByKeyword,
} from "@ledgerhq/live-common/currencies/index";

import { BannerCard, Flex, Text } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { ScreenName } from "../../const";
import { track, TrackScreen } from "../../analytics";
import CurrencyRow from "../../components/CurrencyRow";
import { flattenAccountsSelector } from "../../reducers/accounts";
import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ChartNetworkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { setCloseNetworkBanner } from "../../actions/settings";
import { hasClosedNetworkBannerSelector } from "../../reducers/settings";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

type Props = {
  devMode?: boolean;
} & StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.DepositSelectNetwork>;

const keyExtractor = (currency: CryptoCurrency | TokenCurrency) => currency.id;

const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

const findAccountByCurrency = (accounts: AccountLike[], currency: CryptoCurrency | TokenCurrency) =>
  accounts.filter(
    (acc: AccountLike) =>
      (acc.type === "Account" ? acc.currency?.id : (acc as TokenAccount).token?.id) === currency.id,
  );

export default function SelectNetwork({ navigation, route }: Props) {
  const paramsCurrency = route?.params?.currency;
  const dispatch = useDispatch();
  const hasClosedNetworkBanner = useSelector(hasClosedNetworkBannerSelector);
  const [displayBanner, setBanner] = useState(!hasClosedNetworkBanner);

  const depositNetworkBannerMobile = useFeature("depositNetworkBannerMobile");

  const { t } = useTranslation();
  const filterCurrencyIds = useMemo(
    () => route.params?.filterCurrencyIds || [],
    [route.params?.filterCurrencyIds],
  );
  const cryptoCurrencies = useMemo(
    () =>
      (listSupportedCurrencies() as (CryptoCurrency | TokenCurrency)[])
        .concat(listSupportedTokens())
        .filter(({ id }) => filterCurrencyIds.length <= 0 || filterCurrencyIds.includes(id)),
    [filterCurrencyIds],
  );

  const accounts = useSelector(flattenAccountsSelector);

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  const onPressItem = useCallback(
    (currency: CryptoCurrency | TokenCurrency) => {
      track("network_clicked", {
        network: currency.name,
      });

      const accs = findAccountByCurrency(accounts, currency);
      if (accs.length > 0) {
        // if we found one or more accounts of the given currency we select account
        navigation.navigate(ScreenName.ReceiveSelectAccount, {
          currency,
        });
      } else if (currency.type === "TokenCurrency") {
        // cases for token currencies
        const parentAccounts = findAccountByCurrency(accounts, currency.parentCurrency);

        if (parentAccounts.length > 1) {
          // if we found one or more accounts of the parent currency we select account

          navigation.navigate(ScreenName.ReceiveSelectAccount, {
            currency,
            createTokenAccount: true,
          });
        } else if (parentAccounts.length === 1) {
          // if we found only one account of the parent currency we go straight to QR code
          navigation.navigate(ScreenName.ReceiveConfirmation, {
            accountId: parentAccounts[0].id,
            currency,
            createTokenAccount: true,
          });
        } else {
          // if we didn't find any account of the parent currency we add and create one
          navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
            currency: currency.parentCurrency,
            createTokenAccount: true,
          });
        }
      } else {
        // else we create a currency account
        navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
          currency,
        });
      }
    },
    [accounts, navigation],
  );

  const hideBanner = useCallback(() => {
    track("button_clicked", {
      button: "Close network article",
    });
    dispatch(setCloseNetworkBanner(true));
    setBanner(false);
  }, [dispatch]);

  const clickLearn = useCallback(() => {
    track("button_clicked", {
      button: "Choose a network article",
      type: "card",
    });
    Linking.openURL(depositNetworkBannerMobile?.params.url);
  }, [depositNetworkBannerMobile?.params.url]);

  useEffect(() => {
    if (paramsCurrency) {
      const selectedCurrency = findCryptoCurrencyByKeyword(paramsCurrency.toUpperCase());

      if (selectedCurrency) {
        onPressItem(selectedCurrency);
      }
    }
  }, [onPressItem, paramsCurrency]);

  const insets = useSafeAreaInsets();

  return (
    <>
      <TrackScreen name="Choose a network" />
      <Flex px={6} py={2}>
        <Text variant="h4" fontWeight="semiBold" testID="receive-header-step2-title" mb={2}>
          {t("transfer.receive.selectNetwork.title")}
        </Text>
        <Text
          variant="bodyLineHeight"
          fontWeight="medium"
          color="neutral.c80"
          testID="receive-header-step2-subtitle"
        >
          {t("transfer.receive.selectNetwork.subtitle")}
        </Text>
      </Flex>

      <FlatList
        contentContainerStyle={styles.list}
        data={sortedCryptoCurrencies}
        renderItem={({ item }) => (
          <CurrencyRow iconSize={32} currency={item} onPress={onPressItem} />
        )}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />

      {depositNetworkBannerMobile?.enabled && displayBanner && (
        <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
          <Flex pb={insets.bottom} px={6}>
            <BannerCard
              typeOfRightIcon="close"
              title={t("transfer.receive.selectNetwork.bannerTitle")}
              LeftElement={<ChartNetworkMedium />}
              onPressDismiss={hideBanner}
              onPress={clickLearn}
            />
          </Flex>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 32,
  },
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
});
