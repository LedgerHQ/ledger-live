import React, { useMemo, useState, useCallback, useEffect } from "react";
import { FlatList, LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/native-ui";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useSingleCoinMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import accountSyncRefreshControl from "../../../components/accountSyncRefreshControl";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import SectionContainer from "../../WalletCentricSections/SectionContainer";
import SectionTitle from "../../WalletCentricSections/SectionTitle";
import MarketPriceSection from "../../WalletCentricSections/MarketPrice";
import EmptyAccountCard from "../../Account/EmptyAccountCard";
import AssetCentricGraphCard from "../../../components/AssetCentricGraphCard";
import CurrencyBackgroundGradient from "../../../components/CurrencyBackgroundGradient";
import Header from "../Header";
import { usePortfolio } from "../../../hooks/portfolio";
import {
  counterValueCurrencySelector,
  countervalueFirstSelector,
  hasOrderedNanoSelector,
} from "../../../reducers/settings";
import BuyDeviceBanner, {
  IMAGE_PROPS_BIG_NANO,
} from "../../../components/BuyDeviceBanner";
import SetupDeviceBanner from "../../../components/SetupDeviceBanner";
import { FabAssetActions } from "../../../components/FabActions/actionsList/asset";
import { TrackScreen } from "../../../analytics";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "../../../components/RootNavigator/types/AccountsNavigator";
import { ScreenName } from "../../../const";

type NavigationProps = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Asset>
>;

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

// @FIXME workarround for main tokens
const tokenIDToMarketID = {
  "ethereum/erc20/usd_tether__erc20_": "tether",
  "ethereum/erc20/usd__coin": "usd",
};

const ReadOnlyAssetScreen = ({ route }: NavigationProps) => {
  const { t } = useTranslation();
  const currency = route?.params?.currency;
  const { colors } = useTheme();
  const useCounterValue = useSelector(countervalueFirstSelector);

  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );

  const assetPortfolio = usePortfolio([], {});
  const { selectedCoinData, selectCurrency, counterCurrency } =
    useSingleCoinMarketData();

  useEffect(() => {
    selectCurrency(
      tokenIDToMarketID[currency.id as keyof typeof tokenIDToMarketID] ||
        currency.id,
      undefined,
      "24h",
    );
  }, [currency, selectCurrency]);

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(100);
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler(event => {
    currentPositionY.value = event.contentOffset.y;
  });

  const onAssetCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  const data = useMemo(
    () => [
      <Flex mt={6} onLayout={onAssetCardLayout}>
        <AssetCentricGraphCard
          assetPortfolio={assetPortfolio}
          counterValueCurrency={counterValueCurrency}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          currency={currency}
          currencyBalance={0}
          accountsEmpty={true}
        />
      </Flex>,
      <SectionContainer px={6}>
        <SectionTitle
          title={t("account.quickActions")}
          containerProps={{ mb: 6 }}
        />
        <FabAssetActions currency={currency} />
        <Flex minHeight={220}>
          <EmptyAccountCard currencyTicker={currency.ticker} />
        </Flex>
      </SectionContainer>,
      ...(selectedCoinData?.price
        ? [
            <SectionContainer px={6}>
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
      <SectionContainer mx={6} isLast>
        {hasOrderedNano ? (
          <SetupDeviceBanner screen="Assets" />
        ) : (
          <BuyDeviceBanner
            style={{
              marginTop: 40,
              paddingTop: 13.5,
              paddingBottom: 13.5,
            }}
            buttonLabel={t("buyDevice.bannerButtonTitle")}
            buttonSize="small"
            event="button_clicked"
            eventProperties={{
              button: "Discover the Nano",
              screen: "Account",
              currency: currency.name,
            }}
            screen="Account"
            {...IMAGE_PROPS_BIG_NANO}
          />
        )}
      </SectionContainer>,
    ],
    [
      onAssetCardLayout,
      assetPortfolio,
      counterValueCurrency,
      currentPositionY,
      graphCardEndPosition,
      currency,
      t,
      selectedCoinData,
      counterCurrency,
      hasOrderedNano,
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
        style={{ flex: 1, paddingTop: 48, marginBottom: 40 }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        data={data}
        renderItem={({ item }) => item as JSX.Element}
        keyExtractor={(_, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
      />
      <Header
        currentPositionY={currentPositionY}
        graphCardEndPosition={graphCardEndPosition}
        currency={currency}
        useCounterValue={useCounterValue}
        assetPortfolio={assetPortfolio}
        currencyBalance={0}
        counterValueCurrency={counterValueCurrency}
      />
    </TabBarSafeAreaView>
  );
};

export default withDiscreetMode(ReadOnlyAssetScreen);
