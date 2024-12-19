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
import { track, TrackScreen } from "~/analytics";
import { FabAssetActions } from "~/components/FabActions/actionsList/asset";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AssetDynamicContent from "./AssetDynamicContent";
import AssetMarketSection from "./AssetMarketSection";
import AssetGraph from "./AssetGraph";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { View } from "react-native-animatable";
import Alert from "~/components/Alert";
import { urls } from "~/utils/urls";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Asset>
>;

const AssetScreen = ({ route }: NavigationProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
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

  const onAddAccount = useCallback(() => {
    track("button_clicked", {
      button: "Add new",
    });
    if (llmNetworkBasedAddAccountFlow?.enabled) {
      navigation.navigate(NavigatorName.AssetSelection, {
        ...(currency && currency.type === "TokenCurrency"
          ? { token: currency.id }
          : { currency: currency.id }),
        context: "addAccounts",
      });
    } else {
      if (currency && currency.type === "TokenCurrency") {
        navigation.navigate(NavigatorName.AddAccounts, {
          screen: undefined,
          params: {
            token: currency,
          },
        });
      } else {
        navigation.navigate(NavigatorName.AddAccounts, {
          screen: undefined,
          currency,
        });
      }
    }
  }, [currency, navigation, llmNetworkBasedAddAccountFlow]);

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
      currencyConfig?.status.type === "will_be_deprecated" && (
        <View style={{ marginTop: 16 }}>
          <Alert
            key="deprecated_banner"
            type="warning"
            learnMoreKey="account.willBedeprecatedBanner.contactSupport"
            learnMoreUrl={urls.contactSupportWebview.en}
          >
            {t("account.willBedeprecatedBanner.title", {
              currencyName: currency.name,
              deprecatedDate: currencyConfig.status.deprecated_date,
            })}
          </Alert>
        </View>
      ),
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
