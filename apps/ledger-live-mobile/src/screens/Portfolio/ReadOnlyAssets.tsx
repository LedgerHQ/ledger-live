import React, { useCallback, useMemo, memo } from "react";
import { FlatList } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";

import { useTranslation } from "react-i18next";
import {
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/currencies/index";
import TrackScreen from "../../analytics/TrackScreen";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

import GradientContainer from "../../components/GradientContainer";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import AssetRow from "../WalletCentricAsset/AssetRow";
import AssetsNavigationHeader from "../Assets/AssetsNavigationHeader";

type Props = {
  navigation: any;
  route: { params?: { currency?: string; search?: string } };
};

const maxReadOnlyCryptoCurrencies = 10;

function ReadOnlyAssets({ navigation }: Props) {
  const listSupportedTokens = useCallback(
    () => listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    [],
  );
  const cryptoCurrencies = useMemo(
    () => listSupportedCurrencies().concat(listSupportedTokens()),
    [listSupportedTokens],
  );
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);
  const assets = useMemo(
    () =>
      sortedCryptoCurrencies
        .slice(0, maxReadOnlyCryptoCurrencies)
        .map(currency => ({
          amount: 0,
          accounts: [],
          currency,
        })),
    [sortedCryptoCurrencies],
  );

  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <AssetRow asset={item} navigation={navigation} />
    ),
    [navigation],
  );

  return (
    <TabBarSafeAreaView>
      <TrackScreen category="ReadOnly" name="Assets" />
      <Flex flex={1} bg={"background.main"}>
        <AssetsNavigationHeader readOnly />
        <FlatList
          data={assets}
          renderItem={renderItem}
          keyExtractor={(i: any) => i.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: TAB_BAR_SAFE_HEIGHT,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Flex mt={3} mb={3}>
              <Text variant="h4">{t("distribution.title")}</Text>
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

export default memo(withDiscreetMode(ReadOnlyAssets));
