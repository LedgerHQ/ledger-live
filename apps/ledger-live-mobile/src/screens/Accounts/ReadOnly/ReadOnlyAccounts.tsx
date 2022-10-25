import React, { useCallback, useMemo, memo, useContext } from "react";
import { FlatList } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useFocusEffect } from "@react-navigation/native";

import { useTranslation } from "react-i18next";
import {
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import TrackScreen from "../../../analytics/TrackScreen";

import ReadOnlyAccountRow from "./ReadOnlyAccountRow";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";

import GradientContainer from "../../../components/GradientContainer";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import AccountsNavigationHeader from "../AccountsNavigationHeader";
// eslint-disable-next-line import/no-cycle
import { AnalyticsContext } from "../../../components/RootNavigator";

type Props = {
  navigation: any;
  route: { params?: { currency?: string; search?: string } };
};

const maxReadOnlyCryptoCurrencies = 10;

function ReadOnlyAccounts({ navigation, route }: Props) {
  const listSupportedTokens = useCallback(
    () => listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    [],
  );
  const cryptoCurrencies = useMemo(
    () => listSupportedCurrencies().concat(listSupportedTokens()),
    [listSupportedTokens],
  );
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);
  const accounts = useMemo(
    () => sortedCryptoCurrencies.slice(0, maxReadOnlyCryptoCurrencies),
    [sortedCryptoCurrencies],
  );

  const { t } = useTranslation();

  const { params } = route;

  const renderItem = useCallback(
    ({ item }: { item: CryptoCurrency }) => (
      <ReadOnlyAccountRow
        navigation={navigation}
        currency={item}
        screen="Assets"
      />
    ),
    [navigation],
  );

  const { source, setSource, setScreen } = useContext(AnalyticsContext);

  useFocusEffect(
    useCallback(() => {
      setScreen("Assets");

      return () => {
        setSource("Assets");
      };
    }, [setSource, setScreen]),
  );

  return (
    <TabBarSafeAreaView>
      <TrackScreen category="ReadOnly" name="Assets" source={source} />
      <Flex flex={1} bg={"background.main"}>
        <AccountsNavigationHeader readOnly />
        <FlatList
          data={accounts}
          renderItem={renderItem}
          keyExtractor={(i: any) => i.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: TAB_BAR_SAFE_HEIGHT,
          }}
          ListHeaderComponent={
            <Flex mt={3} mb={3}>
              <Text variant="h4">
                {params?.currencyTicker
                  ? t("accounts.cryptoAccountsTitle", {
                      currencyTicker: params?.currencyTicker,
                    })
                  : t("accounts.title")}
              </Text>
            </Flex>
          }
          ListFooterComponent={
            <GradientContainer containerStyle={{ width: "100%" }}>
              <Flex p={6} alignItems="center" justifyContent="center">
                <Text
                  variant="large"
                  fontWeight="semiBold"
                  color="neutral.c100"
                  textAlign="center"
                >
                  {t("accounts.readOnly.moreCrypto.title")}
                </Text>
                <Text
                  variant="small"
                  fontWeight="medium"
                  color="neutral.c70"
                  textAlign="center"
                  mt={3}
                >
                  {t("accounts.readOnly.moreCrypto.subtitle")}
                </Text>
              </Flex>
            </GradientContainer>
          }
        />
      </Flex>
    </TabBarSafeAreaView>
  );
}

export default memo(withDiscreetMode(ReadOnlyAccounts));
