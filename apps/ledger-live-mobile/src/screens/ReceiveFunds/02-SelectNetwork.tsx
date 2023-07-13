import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, FlatList, Linking } from "react-native";
import type {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import {
  useCurrenciesByMarketcap,
  findCryptoCurrencyById,
} from "@ledgerhq/live-common/currencies/index";

import { BannerCard, Flex, Text } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { ScreenName } from "../../const";
import { track, TrackScreen } from "../../analytics";
import { flattenAccountsSelector } from "../../reducers/accounts";
import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ChartNetworkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { setCloseNetworkBanner } from "../../actions/settings";
import { hasClosedNetworkBannerSelector } from "../../reducers/settings";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import BigCurrencyRow from "../../components/BigCurrencyRow";
import { findAccountByCurrency } from "../../logic/deposit";

type Props = {
  devMode?: boolean;
} & StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.DepositSelectNetwork>;

const keyExtractor = (currency: CryptoCurrency | TokenCurrency) => currency.id;

export default function SelectNetwork({ navigation, route }: Props) {
  const provider = route?.params?.provider;

  const networks = useMemo(
    () =>
      provider?.currenciesByNetwork.map(elem =>
        elem.type === "TokenCurrency" ? elem.parentCurrency.id : elem.id,
      ) || [],
    [provider?.currenciesByNetwork],
  );

  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const hasClosedNetworkBanner = useSelector(hasClosedNetworkBannerSelector);
  const [displayBanner, setBanner] = useState(!hasClosedNetworkBanner);

  const depositNetworkBannerMobile = useFeature("depositNetworkBannerMobile");

  const { t } = useTranslation();

  const cryptoCurrencies = useMemo(() => {
    if (!networks) {
      return [];
    } else {
      return networks.map(net => {
        const selectedCurrency = findCryptoCurrencyById(net);
        if (selectedCurrency) return selectedCurrency;
        else return null;
      });
    }
  }, [networks]);

  const accounts = useSelector(flattenAccountsSelector);

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(
    cryptoCurrencies.filter(e => !!e) as CryptoCurrency[],
  );

  const onPressItem = useCallback(
    (currency: CryptoCurrency | TokenCurrency) => {
      track("network_clicked", {
        network: currency.name,
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
          navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
            currency: cryptoToSend.parentCurrency,
            createTokenAccount: true,
          });
        }
      } else {
        // else we create a currency account
        navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
          currency: cryptoToSend,
        });
      }
    },
    [accounts, navigation, provider],
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

  const renderItem = useCallback(
    ({ item }: { item: CryptoOrTokenCurrency }) => {
      const accs = findAccountByCurrency(accounts, item);
      return (
        <BigCurrencyRow
          currency={item}
          onPress={onPressItem}
          subTitle={
            accs.length > 1
              ? t("transfer.receive.selectNetwork.accounts", { count: accs.length })
              : ""
          }
        />
      );
    },
    [accounts, onPressItem, t],
  );

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
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />

      {depositNetworkBannerMobile?.enabled && displayBanner && (
        <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
          <Flex pb={insets.bottom + 2} px={6}>
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
