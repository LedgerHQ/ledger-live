import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, FlatList, Linking } from "react-native";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { NavigatorName, ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { setCloseNetworkBanner } from "~/actions/settings";
import { hasClosedNetworkBannerSelector } from "~/reducers/settings";
import BigCurrencyRow from "~/components/BigCurrencyRow";
import { findAccountByCurrency } from "~/logic/deposit";
import { AccountLike } from "@ledgerhq/types-live";
import { urls } from "~/utils/urls";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import NetworkBanner from "LLM/features/AssetSelection/components/NetworkBanner";
import useBannerAnimation from "LLM/features/AssetSelection/screens/SelectNetwork/useBannerAnimation";
import Animated from "react-native-reanimated";

type CryptoWithAccounts = { crypto: CryptoCurrency; accounts: AccountLike[] };

type Props = {
  devMode?: boolean;
} & StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.DepositSelectNetwork>;

const keyExtractor = (elem: CryptoWithAccounts) => elem.crypto.id;
export default function SelectNetwork({ navigation, route }: Props) {
  const provider = route?.params?.provider;
  const filterCurrencyIds = route?.params?.filterCurrencyIds;
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");

  const networks = useMemo(
    () =>
      provider?.currenciesByNetwork.map(elem =>
        elem.type === "TokenCurrency" ? elem.parentCurrency.id : elem.id,
      ) || [],
    [provider?.currenciesByNetwork],
  );

  const dispatch = useDispatch();

  const hasClosedNetworkBanner = useSelector(hasClosedNetworkBannerSelector);
  const [displayBanner, setBanner] = useState(!hasClosedNetworkBanner);

  const { onBannerLayout, animatedStyle } = useBannerAnimation({ displayBanner });

  const { t } = useTranslation();

  const cryptoCurrencies = useMemo(() => {
    if (!networks) {
      return [];
    } else {
      const list = filterCurrencyIds
        ? networks.filter(network => filterCurrencyIds.includes(network))
        : networks;

      return list.map(net => {
        const selectedCurrency = findCryptoCurrencyById(net);
        if (selectedCurrency) return selectedCurrency;
        else return null;
      });
    }
  }, [filterCurrencyIds, networks]);

  const accounts = useSelector(flattenAccountsSelector);

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(
    cryptoCurrencies.filter(e => !!e) as CryptoCurrency[],
  );

  const sortedCryptoCurrenciesWithAccounts: CryptoWithAccounts[] = useMemo(
    () =>
      sortedCryptoCurrencies
        .map(crypto => {
          const accs = findAccountByCurrency(accounts, crypto);
          return {
            crypto,
            accounts: accs,
          };
        })
        .sort((a, b) => b.accounts.length - a.accounts.length),
    [accounts, sortedCryptoCurrencies],
  );

  const goToDeviceSelection = useCallback(
    (currency: CryptoCurrency, createTokenAccount?: boolean) => {
      if (llmNetworkBasedAddAccountFlow?.enabled) {
        navigation.replace(NavigatorName.DeviceSelection, {
          screen: ScreenName.SelectDevice,
          params: {
            currency,
            context: AddAccountContexts.ReceiveFunds,
          },
        });
      } else {
        navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
          currency,
          ...(createTokenAccount && { createTokenAccount }),
        });
      }
    },
    [llmNetworkBasedAddAccountFlow?.enabled, navigation],
  );

  const onPressItem = useCallback(
    (currency: CryptoCurrency | TokenCurrency) => {
      track("network_clicked", {
        network: currency.name,
        page: "Choose a network",
      });

      const cryptoToSend = provider?.currenciesByNetwork.find(curByNetwork =>
        curByNetwork.type === "TokenCurrency"
          ? curByNetwork.parentCurrency.id === currency.id
          : curByNetwork.id === currency.id,
      );

      if (!cryptoToSend) return;

      const accs = findAccountByCurrency(accounts, cryptoToSend);

      if (accs.length > 0) {
        // if we found one or more accounts of the given currency we go to select account
        navigation.navigate(ScreenName.ReceiveSelectAccount, {
          currency: cryptoToSend,
        });
      } else if (cryptoToSend.type === "TokenCurrency") {
        // cases for token currencies
        const parentAccounts = findAccountByCurrency(accounts, cryptoToSend.parentCurrency);

        if (parentAccounts.length > 0) {
          // if we found one or more accounts of the parent currency we select account

          navigation.navigate(ScreenName.ReceiveSelectAccount, {
            currency: cryptoToSend,
            createTokenAccount: true,
          });
        } else {
          // if we didn't find any account of the parent currency we add and create one
          goToDeviceSelection(cryptoToSend.parentCurrency, true);
        }
      } else {
        // else we create a currency account
        goToDeviceSelection(cryptoToSend);
      }
    },
    [accounts, navigation, provider, goToDeviceSelection],
  );

  const hideBanner = useCallback(() => {
    track("button_clicked", {
      button: "Close network article",
      page: "Choose a network",
    });
    dispatch(setCloseNetworkBanner(true));
    setBanner(false);
  }, [dispatch]);

  const clickLearn = () => {
    track("button_clicked", {
      button: "Choose a network article",
      type: "card",
      page: "Choose a network",
    });
    Linking.openURL(urls.chooseNetwork);
  };

  const renderItem = useCallback(
    ({ item }: { item: CryptoWithAccounts }) => (
      <BigCurrencyRow
        currency={item.crypto}
        onPress={onPressItem}
        subTitle={
          item.accounts.length > 0
            ? t("transfer.receive.selectNetwork.account", { count: item.accounts.length })
            : ""
        }
      />
    ),
    [onPressItem, t],
  );

  return (
    <>
      <TrackScreen category="Deposit" name="Choose a network" />
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
      <Flex ml={16} mr={16} flex={1}>
        <FlatList
          testID="receive-header-step2-networks"
          contentContainerStyle={styles.list}
          data={sortedCryptoCurrenciesWithAccounts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
      </Flex>
      <Animated.View style={[animatedStyle]}>
        <NetworkBanner hideBanner={hideBanner} onLayout={onBannerLayout} onPress={clickLearn} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 32,
  },
});
