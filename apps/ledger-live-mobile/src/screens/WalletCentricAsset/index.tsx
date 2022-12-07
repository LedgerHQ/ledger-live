import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  Linking,
  ListRenderItemInfo,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Box, Flex, CardB } from "@ledgerhq/native-ui";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { isAccountEmpty } from "@ledgerhq/live-common/account/helpers";
import { useTheme } from "styled-components/native";
import { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { useNavigation } from "@react-navigation/native";
import { useSingleCoinMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "../../reducers/accounts";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import MarketPriceSection from "../WalletCentricSections/MarketPrice";
import AccountsSection from "./AccountsSection";
import { NavigatorName, ScreenName } from "../../const";
import EmptyAccountCard from "../Account/EmptyAccountCard";
import AssetCentricGraphCard from "../../components/AssetCentricGraphCard";
import CurrencyBackgroundGradient from "../../components/CurrencyBackgroundGradient";
import Header from "./Header";
import { usePortfolio } from "../../hooks/portfolio";
import {
  counterValueCurrencySelector,
  countervalueFirstSelector,
} from "../../reducers/settings";
import { track, TrackScreen } from "../../analytics";
import { FabAssetActions } from "../../components/FabActions/actionsList/asset";
import { AccountsNavigatorParamList } from "../../components/RootNavigator/types/AccountsNavigator";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import useDynamicContent from "../../dynamicContent/dynamicContent";

// @FIXME workarround for main tokens
const tokenIDToMarketID = {
  "ethereum/erc20/usd_tether__erc20_": "tether",
  "ethereum/erc20/usd__coin": "usd",
};

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
  const useCounterValue = useSelector(countervalueFirstSelector);
  const { currency } = route?.params;
  const isCryptoCurrency = currency?.type === "CryptoCurrency";
  const cryptoAccounts = useSelector(
    flattenAccountsByCryptoCurrencyScreenSelector(currency),
  );
  const defaultAccount = useMemo(
    () =>
      cryptoAccounts && cryptoAccounts.length === 1
        ? cryptoAccounts[0]
        : undefined,
    [cryptoAccounts],
  );

  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );

  const assetPortfolio = usePortfolio(cryptoAccounts, {
    flattenSourceAccounts: false,
  });
  const { selectedCoinData, selectCurrency, counterCurrency } =
    useSingleCoinMarketData();

  useEffect(() => {
    selectCurrency(
      tokenIDToMarketID[currency.id as keyof typeof tokenIDToMarketID] ||
        currency.id,
      undefined,
      "24h",
    );
    return () => selectCurrency();
  }, [currency, selectCurrency]);

  const cryptoAccountsEmpty = useMemo(
    () => cryptoAccounts.every(account => isAccountEmpty(account)),
    [cryptoAccounts],
  );

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(60);
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler(event => {
    currentPositionY.value = event.contentOffset.y;
  });

  const currencyBalance = useMemo(
    () => cryptoAccounts.reduce((acc, val) => acc + val.balance.toNumber(), 0),
    [cryptoAccounts],
  );

  const onAssetCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

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

  // Dynamic Content Part -------------------
  const {
    getAssetCardByIdOrTicker,
    logClickCard,
    logImpressionCard,
    dismissCard,
    trackContentCardEvent,
  } = useDynamicContent();
  const dynamicContentCard = getAssetCardByIdOrTicker(currency);

  const onClickLink = useCallback(() => {
    if (!dynamicContentCard) return;

    trackContentCardEvent("contentcard_clicked", {
      screen: dynamicContentCard.location,
      link: dynamicContentCard.link,
      campaign: dynamicContentCard.id,
    });

    // Notify Braze that the card has been clicked by the user
    logClickCard(dynamicContentCard.id);
    Linking.openURL(dynamicContentCard.link);
  }, [dynamicContentCard, logClickCard, trackContentCardEvent]);

  const onPressDismiss = useCallback(() => {
    if (!dynamicContentCard) return;

    trackContentCardEvent("contentcard_dismissed", {
      screen: dynamicContentCard.location,
      link: dynamicContentCard.link,
      campaign: dynamicContentCard.id,
    });

    dismissCard(dynamicContentCard.id);
  }, [dismissCard, dynamicContentCard, trackContentCardEvent]);

  useEffect(() => {
    if (dynamicContentCard) {
      // Notify Braze that the card has been displayed to the user
      logImpressionCard(dynamicContentCard.id);
    }
  }, [dynamicContentCard, logImpressionCard]);

  // Dynamic Content ---------------------------------

  const data = useMemo(
    () => [
      <Box mt={6} onLayout={onAssetCardLayout}>
        <AssetCentricGraphCard
          assetPortfolio={assetPortfolio}
          counterValueCurrency={counterValueCurrency}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          currency={currency}
          currencyBalance={currencyBalance}
          accountsEmpty={cryptoAccountsEmpty}
        />
      </Box>,
      <SectionContainer px={6}>
        <SectionTitle
          title={t("account.quickActions")}
          containerProps={{ mb: 6 }}
        />
        <FabAssetActions
          currency={currency}
          accounts={cryptoAccounts}
          defaultAccount={defaultAccount}
        />
        {!!dynamicContentCard && (
          <Flex mt={6}>
            <CardB
              title={dynamicContentCard.title}
              tag={dynamicContentCard.tag}
              cta={dynamicContentCard.cta}
              imageUrl={dynamicContentCard.image}
              onPress={onClickLink}
              onPressDismiss={onPressDismiss}
            />
          </Flex>
        )}
        {cryptoAccountsEmpty ? (
          <Flex minHeight={220}>
            <EmptyAccountCard currencyTicker={currency.ticker} />
          </Flex>
        ) : null}
      </SectionContainer>,
      <SectionContainer
        px={6}
        isLast={
          (!isCryptoCurrency || !selectedCoinData?.price) && cryptoAccountsEmpty
        }
      >
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
      ...(selectedCoinData?.price
        ? [
            <SectionContainer px={6} isLast={cryptoAccountsEmpty}>
              <SectionTitle
                title={t("portfolio.marketPriceSection.title", {
                  currencyTicker: currency.ticker,
                })}
              />
              <Flex minHeight={65}>
                <MarketPriceSection
                  currency={currency as CryptoCurrency}
                  selectedCoinData={selectedCoinData}
                  counterCurrency={counterCurrency}
                />
              </Flex>
            </SectionContainer>,
          ]
        : []),
      ...(!cryptoAccountsEmpty
        ? [
            <SectionContainer px={6} isLast>
              <SectionTitle title={t("analytics.operations.title")} />
              <OperationsHistorySection accounts={cryptoAccounts} />
            </SectionContainer>,
          ]
        : []),
    ],
    [
      onAssetCardLayout,
      assetPortfolio,
      counterValueCurrency,
      currentPositionY,
      graphCardEndPosition,
      currency,
      currencyBalance,
      cryptoAccountsEmpty,
      t,
      cryptoAccounts,
      defaultAccount,
      isCryptoCurrency,
      selectedCoinData,
      onAddAccount,
      counterCurrency,
      dynamicContentCard,
      onClickLink,
      onPressDismiss,
    ],
  );

  return (
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
        useCounterValue={useCounterValue}
        assetPortfolio={assetPortfolio}
        currencyBalance={currencyBalance}
        counterValueCurrency={counterValueCurrency}
      />
    </TabBarSafeAreaView>
  );
};

export default withDiscreetMode(AssetScreen);
