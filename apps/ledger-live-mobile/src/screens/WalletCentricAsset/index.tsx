import React, { useMemo, useState, useCallback, useEffect } from "react";
import { FlatList, LayoutChangeEvent } from "react-native";
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
import {
  CryptoCurrency,
  Currency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { useNavigation } from "@react-navigation/native";
import { useSingleCoinMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
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
import { NavigatorName } from "../../const";
import EmptyAccountCard from "../Account/EmptyAccountCard";
import AssetCentricGraphCard from "../../components/AssetCentricGraphCard";
import CurrencyBackgroundGradient from "../../components/CurrencyBackgroundGradient";
import Header from "./Header";
import { usePortfolio } from "../../actions/portfolio";
import {
  counterValueCurrencySelector,
  countervalueFirstSelector,
} from "../../reducers/settings";
import { track, TrackScreen } from "../../analytics";
import { FabAssetActions } from "../../components/FabActions/actionsList/asset";

type RouteParams = {
  currency: CryptoCurrency | TokenCurrency;
};

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

// @FIXME workarround for main tokens
const tokenIDToMarketID = {
  "ethereum/erc20/usd_tether__erc20_": "tether",
  "ethereum/erc20/usd__coin": "usd",
};

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

const AssetScreen = ({ route }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
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
      tokenIDToMarketID[currency.id] || currency.id,
      currency,
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
        token: currency,
      });
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        currency,
      });
    }
  }, [currency, navigation]);

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
          accounts={cryptoAccounts}
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
                  currency={currency}
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
        renderItem={({ item }: any) => item}
        keyExtractor={(_: any, index: any) => String(index)}
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
