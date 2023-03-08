import React, { useMemo, useState, useCallback, useRef } from "react";
import { FlatList, LayoutChangeEvent, ListRenderItemInfo } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Box, Flex } from "@ledgerhq/native-ui";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { isAccountEmpty } from "@ledgerhq/live-common/account/helpers";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { isEqual } from "lodash";
import BigNumber from "bignumber.js";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "../../reducers/accounts";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import AccountsSection from "./AccountsSection";
import { NavigatorName, ScreenName } from "../../const";
import EmptyAccountCard from "../Account/EmptyAccountCard";
import CurrencyBackgroundGradient from "../../components/CurrencyBackgroundGradient";
import Header from "./Header";
import { track, TrackScreen } from "../../analytics";
import { FabAssetActions } from "../../components/FabActions/actionsList/asset";
import { AccountsNavigatorParamList } from "../../components/RootNavigator/types/AccountsNavigator";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import AssetDynamicContent from "./AssetDynamicContent";
import AssetMarketSection from "./AssetMarketSection";
import AssetGraph from "./AssetGraph";

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

  const defaultAccount =
    cryptoAccounts?.length === 1 ? cryptoAccounts[0] : undefined;

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
    () =>
      cryptoAccounts.reduce((acc, val) => acc.plus(val.balance), BigNumber(0)),
    [cryptoAccounts],
  );

  const onAddAccount = useCallback(() => {
    track("button_clicked", {
      button: "Add new",
    });
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
  }, [currency, navigation]);

  const data = useMemo(
    () => [
      <Box mt={6} onLayout={onGraphCardLayout}>
        <AssetGraph
          accounts={cryptoAccounts}
          currency={currency}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          currencyBalance={currencyBalance.toNumber()}
          accountsAreEmpty={cryptoAccountsEmpty}
        />
      </Box>,
      <SectionContainer px={6} isFirst>
        <SectionTitle
          title={t("account.quickActions")}
          containerProps={{ mb: 6 }}
        />
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
      <SectionContainer px={6}>
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
      <AssetMarketSection currency={currency} />,
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
    ],
  );

  return (
    <ReactNavigationPerformanceView screenName={ScreenName.Asset} interactive>
      <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
        <TrackScreen category="Asset" currency={currency.name} />
        <CurrencyBackgroundGradient
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          gradientColor={getCurrencyColor(currency) || colors.primary.c80}
        />
        <AnimatedFlatListWithRefreshControl
          style={{ flex: 1, paddingTop: 48 }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
          data={data}
          renderItem={({ item }: ListRenderItemInfo<unknown>) =>
            item as JSX.Element
          }
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
      </TabBarSafeAreaView>
    </ReactNavigationPerformanceView>
  );
};

export default React.memo(withDiscreetMode(AssetScreen));
