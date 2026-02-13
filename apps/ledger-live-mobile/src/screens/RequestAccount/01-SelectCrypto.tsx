import React, { useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "~/context/Locale";
import { StyleSheet, View, FlatList, SafeAreaView, ListRenderItem } from "react-native";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import KeyboardView from "~/components/KeyboardView";
import CurrencyRow from "~/components/CurrencyRow";
import LText from "~/components/LText";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { RequestAccountNavigatorParamList } from "~/components/RootNavigator/types/RequestAccountNavigator";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import VersionNumber from "react-native-version-number";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";
import { Flex, InfiniteLoader, SearchInput } from "@ledgerhq/native-ui";
import { useGetMarketcapIdsQuery } from "~/api/countervaluesMarketcapApi";

type Navigation = StackNavigatorProps<
  RequestAccountNavigatorParamList,
  ScreenName.RequestAccountsSelectCrypto
>;

type Props = Navigation;

const keyExtractor = (currency: CryptoOrTokenCurrency) => currency.id;

const EmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

const Loader = () => (
  <Flex marginRight={4} justifyContent={"center"} paddingTop={3}>
    <InfiniteLoader size={30} />
  </Flex>
);

export default function RequestAccountsSelectCrypto({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { currencyIds, useCase } = route.params;
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>("");

  const isAcceptedCurrency = useAcceptedCurrency();
  const devMode = useEnv("MANAGER_DEV_MODE");

  const { data, isLoading, isFetchingNextPage, loadNext } = useAssetsData({
    search: searchValue,
    currencyIds,
    product: "llm",
    version: VersionNumber.appVersion,
    areCurrenciesFiltered: currencyIds && currencyIds.length > 0,
    isStaging: false,
    includeTestNetworks: devMode,
    useCase,
  });

  // Pagination is a bit strange with this because we order by market cap
  // but it works fine and keeps the old/expected order as much as possible
  const { data: ids = [] } = useGetMarketcapIdsQuery(undefined, {
    pollingInterval: 30 * 60 * 1000,
    refetchOnReconnect: true,
  });

  // TODO: Make sure we don't have delisted tokens here too
  const assetsToDisplay = useMemo(() => {
    if (!data) return [];

    const orderedSet = ids.reduce<Set<CryptoOrTokenCurrency>>((acc, id) => {
      const currency = data.cryptoOrTokenCurrencies[id];
      if (currency && isAcceptedCurrency(currency)) {
        acc.add(currency);
      }
      return acc;
    }, new Set());

    data.currenciesOrder.metaCurrencyIds
      .flatMap(metaCurrencyId => {
        const assetsIds = data.cryptoAssets[metaCurrencyId]?.assetsIds;
        return assetsIds ? Object.values(assetsIds) : [];
      })
      .forEach(currencyId => {
        const currency = data.cryptoOrTokenCurrencies[currencyId];
        if (currency && isAcceptedCurrency(currency)) {
          orderedSet.add(currency);
        }
      });

    return Array.from(orderedSet);
  }, [data, ids, isAcceptedCurrency]);

  const onPressCurrency = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      navigation.navigate(ScreenName.RequestAccountsSelectAccount, {
        ...route.params,
        currency,
      });
    },
    [navigation, route.params],
  );
  const renderItem: ListRenderItem<CryptoOrTokenCurrency> = useCallback(
    ({ item }) => <CurrencyRow currency={item} onPress={onPressCurrency} />,
    [onPressCurrency],
  );
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="RequestAccounts" name="SelectCrypto" />
      <KeyboardView>
        <View style={styles.searchContainer}>
          <Flex mb={2} mx={4}>
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder={t("common.search")}
              placeholderTextColor={colors.fog}
              testID="common-search-field"
            />
          </Flex>

          {isLoading ? (
            <Loader />
          ) : (
            <FlatList
              initialNumToRender={20}
              contentContainerStyle={styles.list}
              data={assetsToDisplay}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              onEndReached={loadNext}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={<EmptyList />}
              ListFooterComponent={isFetchingNextPage ? <Loader /> : null}
            />
          )}
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchContainer: {
    paddingTop: 16,
    flex: 1,
  },
  list: {
    paddingBottom: 32,
  },
  emptySearch: {
    paddingHorizontal: 16,
  },
  emptySearchText: {
    textAlign: "center",
  },
});
