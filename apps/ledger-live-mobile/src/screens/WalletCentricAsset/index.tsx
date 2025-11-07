import React, { useMemo, useState, useCallback, useRef } from "react";
import { FlatList, LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Box, Flex } from "@ledgerhq/native-ui";
import { getCurrencyColor, isCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { isAccountEmpty } from "@ledgerhq/live-common/account/helpers";
import { useTheme } from "styled-components/native";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import VersionNumber from "react-native-version-number";
import { Loading } from "~/components/Loading";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import isEqual from "lodash/isEqual";
import BigNumber from "bignumber.js";

import accountSyncRefreshControl from "~/components/accountSyncRefreshControl";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import SafeAreaView from "~/components/SafeAreaView";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import AccountsSection from "./AccountsSection";
import { ScreenName } from "~/const";
import EmptyAccountCard from "../Account/EmptyAccountCard";
import CurrencyBackgroundGradient from "~/components/CurrencyBackgroundGradient";
import Header from "./Header";
import { TrackScreen } from "~/analytics";
import { FabAssetActions } from "~/components/FabActions/actionsList/asset";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AssetDynamicContent from "./AssetDynamicContent";
import AssetMarketSection from "./AssetMarketSection";
import AssetGraph from "./AssetGraph";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import WarningBannerStatus from "~/components/WarningBannerStatus";
import WarningCustomBanner from "~/components/WarningCustomBanner";
import { renderItem } from "LLM/utils/renderItem";

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Asset>
>;

const AssetScreen = ({ route }: NavigationProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { currency: preloadedCurrency, currencyId } = route?.params ?? {};

  const { data: assetData, isLoading: isLoadingAssetData } = useAssetsData({
    currencyIds: currencyId ? [currencyId] : undefined,
    product: "llm",
    version: VersionNumber.appVersion,
    areCurrenciesFiltered: true,
    skip: !!preloadedCurrency,
  });

  const currency = useMemo(() => {
    if (preloadedCurrency) return preloadedCurrency;
    if (!currencyId || !assetData) return undefined;

    return assetData.cryptoOrTokenCurrencies?.[currencyId];
  }, [preloadedCurrency, currencyId, assetData]);

  const cryptoAccounts = useSelector(
    flattenAccountsByCryptoCurrencyScreenSelector(currency),
    isEqual,
  );

  const defaultAccount = cryptoAccounts?.length === 1 ? cryptoAccounts[0] : undefined;

  const cryptoAccountsEmpty = useMemo(
    () => cryptoAccounts.every(account => isAccountEmpty(account)),
    [cryptoAccounts],
  );

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(60);
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler(event => {
    currentPositionY.value = event.contentOffset.y;
  });

  const graphCardLayedOutOnce = useRef(false);
  const onGraphCardLayout = useCallback((event: LayoutChangeEvent) => {
    if (!graphCardLayedOutOnce.current) return;
    graphCardLayedOutOnce.current = true;
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

  const currencyBalance = useMemo(
    () => cryptoAccounts.reduce((acc, val) => acc.plus(val.balance), BigNumber(0)),
    [cryptoAccounts],
  );

  let currencyConfig: CurrencyConfig | undefined = undefined;
  if (currency && isCryptoCurrency(currency)) {
    try {
      currencyConfig = getCurrencyConfiguration(currency);
    } catch (e) {
      console.warn(e);
    }
  }

  const data = useMemo(() => {
    if (!currency) return [];
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const accounts = cryptoAccounts as Account[] | TokenAccount[];
    return [
      <Box
        mt={6}
        onLayout={onGraphCardLayout}
        key="AssetGraph"
        testID={`account-assets-${currency.name.toLocaleLowerCase()}`}
      >
        <AssetGraph
          accounts={cryptoAccounts}
          currency={currency}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          currencyBalance={currencyBalance.toNumber()}
          accountsAreEmpty={cryptoAccountsEmpty}
        />
      </Box>,
      <WarningBannerStatus
        currencyConfig={currencyConfig}
        currency={currency}
        key="WarningBanner"
      />,
      <WarningCustomBanner currencyConfig={currencyConfig} key="WarningCustomBanner" />,
      <SectionContainer px={6} isFirst key="AssetDynamicContent">
        <SectionTitle title={t("account.quickActions")} containerProps={{ mb: 6 }} />
        <FabAssetActions
          currency={currency}
          accounts={cryptoAccounts}
          defaultAccount={defaultAccount}
        />
        <AssetDynamicContent currency={currency} />
        {cryptoAccountsEmpty ? (
          <Flex minHeight={220}>
            <EmptyAccountCard currencyTicker={currency.ticker} />
          </Flex>
        ) : null}
      </SectionContainer>,
      <SectionContainer px={6} key="AccountsSection">
        <SectionTitle
          title={t("asset.accountsSection.title", {
            currencyName: currency.ticker,
            count: cryptoAccounts.length,
          })}
          seeMoreText={t("addAccounts.addNew")}
        />
        <AccountsSection
          accounts={accounts}
          currencyId={currency.id}
          currencyTicker={currency.ticker}
        />
      </SectionContainer>,
      <AssetMarketSection currency={currency} key="AssetMarketSection" />,
      cryptoAccountsEmpty ? null : (
        <SectionContainer px={6}>
          <SectionTitle title={t("analytics.operations.title")} />
          <OperationsHistorySection accounts={cryptoAccounts} />
        </SectionContainer>
      ),
    ];
  }, [
    onGraphCardLayout,
    currentPositionY,
    graphCardEndPosition,
    currency,
    currencyBalance,
    cryptoAccountsEmpty,
    t,
    cryptoAccounts,
    defaultAccount,
    currencyConfig,
  ]);

  if (!currency) {
    if (currencyId && isLoadingAssetData) {
      return <Loading />;
    }
    return null;
  }

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} isFlex>
      <TrackScreen category="Asset" currency={currency.name} />
      <CurrencyBackgroundGradient
        currentPositionY={currentPositionY}
        graphCardEndPosition={graphCardEndPosition}
        gradientColor={getCurrencyColor(currency) || colors.primary.c80}
      />
      <AnimatedFlatListWithRefreshControl
        style={{ flex: 1 }}
        data={data}
        renderItem={renderItem<JSX.Element>}
        keyExtractor={(_: unknown, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
      />
      <Header
        currentPositionY={currentPositionY}
        graphCardEndPosition={graphCardEndPosition}
        currency={currency}
        currencyBalance={currencyBalance}
      />
    </SafeAreaView>
  );
};

export default React.memo(withDiscreetMode(AssetScreen));
