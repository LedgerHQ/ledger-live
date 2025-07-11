import React, { useMemo, useState, useCallback, useRef } from "react";
import { FlatList, LayoutChangeEvent, ListRenderItemInfo } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Box, Flex } from "@ledgerhq/native-ui";
import { getCurrencyColor, isCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import { isAccountEmpty } from "@ledgerhq/live-common/account/helpers";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import isEqual from "lodash/isEqual";
import BigNumber from "bignumber.js";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import accountSyncRefreshControl from "~/components/accountSyncRefreshControl";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import SafeAreaView from "~/components/SafeAreaView";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import AccountsSection from "./AccountsSection";
import { NavigatorName, ScreenName } from "~/const";
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
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { LoadingBasedGroupedCurrencies, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import WarningBannerStatus from "~/components/WarningBannerStatus";

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Asset>
>;

const AssetScreen = ({ route }: NavigationProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { currency } = route?.params;
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

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const isAddAccountCtaDisabled = [LoadingStatus.Pending, LoadingStatus.Error].includes(
    providersLoadingStatus,
  );

  const { currenciesByProvider } = result;

  const provider = useMemo(
    () =>
      currency &&
      currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork =>
            (currencyByNetwork as CryptoCurrency | TokenCurrency).id === currency.id,
        ),
      ),
    [currenciesByProvider, currency],
  );

  const onAddAccount = useCallback(() => {
    if (provider && provider?.currenciesByNetwork.length > 1) {
      navigation.navigate(NavigatorName.AssetSelection, {
        screen: ScreenName.SelectNetwork,
        params: {
          currency: currency.id,
          context: AddAccountContexts.AddAccounts,
          sourceScreenName: ScreenName.Asset,
        },
      });
    } else {
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency:
            currency.type === "TokenCurrency"
              ? currency.parentCurrency
              : (currency as CryptoCurrency),
          context: AddAccountContexts.AddAccounts,
        },
      });
    }
  }, [currency, provider, navigation]);

  let currencyConfig: CurrencyConfig | undefined = undefined;
  if (isCryptoCurrency(currency)) {
    try {
      currencyConfig = getCurrencyConfiguration(currency);
    } catch (e) {
      console.warn(e);
    }
  }

  const data = useMemo(
    () => [
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
          })}
          seeMoreText={t("addAccounts.addNew")}
          onSeeAllPress={onAddAccount}
        />
        <AccountsSection
          accounts={cryptoAccounts as Account[] | TokenAccount[]}
          currencyId={currency.id}
          currencyTicker={currency.ticker}
          onAddAccount={onAddAccount}
          isAddAccountCtaDisabled={isAddAccountCtaDisabled}
        />
      </SectionContainer>,
      <AssetMarketSection currency={currency} key="AssetMarketSection" />,
      cryptoAccountsEmpty ? null : (
        <SectionContainer px={6}>
          <SectionTitle title={t("analytics.operations.title")} />
          <OperationsHistorySection accounts={cryptoAccounts} />
        </SectionContainer>
      ),
    ],
    [
      onGraphCardLayout,
      currentPositionY,
      graphCardEndPosition,
      isAddAccountCtaDisabled,
      currency,
      currencyBalance,
      cryptoAccountsEmpty,
      t,
      cryptoAccounts,
      defaultAccount,
      onAddAccount,
      currencyConfig,
    ],
  );

  return (
    <ReactNavigationPerformanceView screenName={ScreenName.Asset} interactive>
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
          renderItem={({ item }: ListRenderItemInfo<unknown>) => item as JSX.Element}
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
    </ReactNavigationPerformanceView>
  );
};

export default React.memo(withDiscreetMode(AssetScreen));
