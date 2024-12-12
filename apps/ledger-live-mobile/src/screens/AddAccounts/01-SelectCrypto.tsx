import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native";
import type {
  CryptoCurrency,
  CryptoCurrencyId,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import {
  isCurrencySupported,
  listTokens,
  listSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import { useTheme } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import CurrencyRow from "~/components/CurrencyRow";
import LText from "~/components/LText";
import { AddAccountsNavigatorParamList } from "~/components/RootNavigator/types/AddAccountsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { getEnv } from "@ledgerhq/live-env";
import { Feature } from "@ledgerhq/types-live";

const SEARCH_KEYS = getEnv("CRYPTO_ASSET_SEARCH_KEYS");

type NavigationProps = StackNavigatorProps<
  AddAccountsNavigatorParamList,
  ScreenName.AddAccountsSelectCrypto
>;

type Props = {
  devMode?: boolean;
} & NavigationProps;

const keyExtractor = (currency: CryptoOrTokenCurrency) => currency.id;

const renderEmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

export default function AddAccountsSelectCrypto({ navigation, route }: Props) {
  const { colors } = useTheme();
  const devMode = useEnv("MANAGER_DEV_MODE");
  const { filterCurrencyIds = [], currency } = route.params || {};
  const filteredCurrencyIds = useMemo(() => new Set(filterCurrencyIds), [filterCurrencyIds]);

  const mock = useEnv("MOCK");

  const axelar = useFeature("currencyAxelar");
  const stargaze = useFeature("currencyStargaze");
  const secretNetwork = useFeature("currencySecretNetwork");
  const umee = useFeature("currencyUmee");
  const desmos = useFeature("currencyDesmos");
  const dydx = useFeature("currencyDydx");
  const onomy = useFeature("currencyOnomy");
  const seiNetwork = useFeature("currencySeiNetwork");
  const quicksilver = useFeature("currencyQuicksilver");
  const persistence = useFeature("currencyPersistence");
  const avaxCChain = useFeature("currencyAvalancheCChain");
  const stacks = useFeature("currencyStacks");
  const optimism = useFeature("currencyOptimism");
  const optimismSepolia = useFeature("currencyOptimismSepolia");
  const arbitrum = useFeature("currencyArbitrum");
  const arbitrumSepolia = useFeature("currencyArbitrumSepolia");
  const rsk = useFeature("currencyRsk");
  const bittorrent = useFeature("currencyBittorrent");
  const energyWeb = useFeature("currencyEnergyWeb");
  const astar = useFeature("currencyAstar");
  const metis = useFeature("currencyMetis");
  const boba = useFeature("currencyBoba");
  const moonriver = useFeature("currencyMoonriver");
  const velasEvm = useFeature("currencyVelasEvm");
  const syscoin = useFeature("currencySyscoin");
  const internetComputer = useFeature("currencyInternetComputer");
  const telosEvm = useFeature("currencyTelosEvm");
  const coreum = useFeature("currencyCoreum");
  const polygonZkEvm = useFeature("currencyPolygonZkEvm");
  const polygonZkEvmTestnet = useFeature("currencyPolygonZkEvmTestnet");
  const base = useFeature("currencyBase");
  const baseSepolia = useFeature("currencyBaseSepolia");
  const klaytn = useFeature("currencyKlaytn");
  const injective = useFeature("currencyInjective");
  const vechain = useFeature("currencyVechain");
  const casper = useFeature("currencyCasper");
  const neonEvm = useFeature("currencyNeonEvm");
  const lukso = useFeature("currencyLukso");
  const linea = useFeature("currencyLinea");
  const lineaSepolia = useFeature("currencyLineaSepolia");
  const blast = useFeature("currencyBlast");
  const blastSepolia = useFeature("currencyBlastSepolia");
  const scroll = useFeature("currencyScroll");
  const scrollSepolia = useFeature("currencyScrollSepolia");
  const icon = useFeature("currencyIcon");
  const ton = useFeature("currencyTon");
  const etherlink = useFeature("currencyEtherlink");
  const zksync = useFeature("currencyZkSync");
  const zksyncSepolia = useFeature("currencyZkSyncSepolia");
  const mantra = useFeature("currencyMantra");
  const cryptoOrg = useFeature("currencyCryptoOrg");

  const featureFlaggedCurrencies = useMemo(
    (): Partial<Record<CryptoCurrencyId, Feature<unknown> | null>> => ({
      axelar,
      stargaze,
      umee,
      desmos,
      dydx,
      secret_network: secretNetwork,
      onomy,
      sei_network: seiNetwork,
      quicksilver,
      persistence,
      avalanche_c_chain: avaxCChain,
      stacks,
      optimism,
      optimism_sepolia: optimismSepolia,
      arbitrum,
      arbitrum_sepolia: arbitrumSepolia,
      rsk,
      bittorrent,
      energy_web: energyWeb,
      astar,
      metis,
      boba,
      moonriver,
      velas_evm: velasEvm,
      syscoin,
      internet_computer: internetComputer,
      telos_evm: telosEvm,
      coreum,
      polygon_zk_evm: polygonZkEvm,
      polygon_zk_evm_testnet: polygonZkEvmTestnet,
      base,
      base_sepolia: baseSepolia,
      klaytn,
      injective,
      vechain,
      casper,
      neon_evm: neonEvm,
      lukso,
      linea,
      ton,
      linea_sepolia: lineaSepolia,
      blast,
      blast_sepolia: blastSepolia,
      scroll,
      scroll_sepolia: scrollSepolia,
      icon,
      etherlink,
      zksync,
      zksync_sepolia: zksyncSepolia,
      mantra,
      crypto_org_cosmos: cryptoOrg,
    }),
    [
      axelar,
      stargaze,
      umee,
      desmos,
      dydx,
      secretNetwork,
      onomy,
      seiNetwork,
      quicksilver,
      persistence,
      avaxCChain,
      stacks,
      optimism,
      optimismSepolia,
      arbitrum,
      arbitrumSepolia,
      rsk,
      bittorrent,
      energyWeb,
      astar,
      metis,
      boba,
      moonriver,
      velasEvm,
      syscoin,
      internetComputer,
      telosEvm,
      coreum,
      polygonZkEvm,
      polygonZkEvmTestnet,
      base,
      baseSepolia,
      klaytn,
      injective,
      vechain,
      casper,
      neonEvm,
      lukso,
      linea,
      ton,
      lineaSepolia,
      blast,
      blastSepolia,
      scroll,
      scrollSepolia,
      icon,
      etherlink,
      zksync,
      zksyncSepolia,
      mantra,
      cryptoOrg,
    ],
  );

  const cryptoCurrencies = useMemo(() => {
    const supportedCurrenciesAndTokens: CryptoOrTokenCurrency[] = [
      ...listSupportedCurrencies(),
      ...listSupportedTokens(),
    ];

    const deactivatedCurrencyIds = new Set(
      mock
        ? []
        : Object.entries(featureFlaggedCurrencies)
            .filter(([, feature]) => !feature?.enabled)
            .map(([id]) => id),
    );

    const currenciesFiltered = supportedCurrenciesAndTokens.filter(c => {
      const id = c.type === "CryptoCurrency" ? c.id : c.parentCurrency.id;
      return (
        // If there's a filter the currency must be part of it
        (!filteredCurrencyIds.size || filteredCurrencyIds.has(c.id)) &&
        // The currency is not part of the deactivated features
        !deactivatedCurrencyIds.has(id)
      );
    });

    if (!devMode) {
      return currenciesFiltered.filter(c => c.type !== "CryptoCurrency" || !c.isTestnetFor);
    }
    return currenciesFiltered;
  }, [devMode, featureFlaggedCurrencies, filteredCurrencyIds, mock]);

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  const onPressCurrency = (currency: CryptoCurrency) => {
    navigation.navigate(ScreenName.AddAccountsSelectDevice, {
      ...(route?.params ?? {}),
      currency,
    });
  };

  const onPressToken = (token: TokenCurrency) => {
    navigation.navigate(ScreenName.AddAccountsTokenCurrencyDisclaimer, {
      token,
    });
  };

  const onPressItem = (currencyOrToken: CryptoOrTokenCurrency) => {
    if (currencyOrToken.type === "TokenCurrency") {
      onPressToken(currencyOrToken);
    } else {
      onPressCurrency(currencyOrToken);
    }
  };

  const renderList = (items: CryptoOrTokenCurrency[]) => (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      renderItem={({ item }: { item: CryptoOrTokenCurrency }) => (
        <CurrencyRow currency={item} onPress={onPressItem} />
      )}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    />
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
      <TrackScreen category="AddAccounts" name="SelectCrypto" />
      <View style={styles.searchContainer}>
        <FilteredSearchBar
          keys={SEARCH_KEYS}
          inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
          list={sortedCryptoCurrencies}
          renderList={renderList}
          renderEmptySearch={renderEmptyList}
          initialQuery={currency}
        />
      </View>
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
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
  },
  emptySearch: {
    paddingHorizontal: 16,
  },
  emptySearchText: {
    textAlign: "center",
  },
});
