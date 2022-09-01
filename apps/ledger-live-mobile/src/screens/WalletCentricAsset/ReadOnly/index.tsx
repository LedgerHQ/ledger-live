import React, { useMemo, useState, useCallback } from "react";
import { FlatList } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Box } from "@ledgerhq/native-ui";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import {
  CryptoCurrency,
  Currency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import accountSyncRefreshControl from "../../../components/accountSyncRefreshControl";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import SectionContainer from "../../WalletCentricSections/SectionContainer";
import SectionTitle from "../../WalletCentricSections/SectionTitle";
import MarketPriceSection from "../../WalletCentricSections/MarketPrice";
import { FabAssetActions } from "../../../components/FabActions";
import EmptyAccountCard from "../../Account/EmptyAccountCard";
import AssetCentricGraphCard from "../../../components/AssetCentricGraphCard";
import CurrencyBackgroundGradient from "../../../components/CurrencyBackgroundGradient";
import Header from "../Header";
import { usePortfolio } from "../../../actions/portfolio";
import { counterValueCurrencySelector, countervalueFirstSelector, hasOrderedNanoSelector } from "../../../reducers/settings";
import BuyDeviceBanner, {
  IMAGE_PROPS_BIG_NANO,
} from "../../../components/BuyDeviceBanner";
import SetupDeviceBanner from "../../../components/SetupDeviceBanner";

type RouteParams = {
  currency: CryptoCurrency | TokenCurrency;
};

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

const ReadOnlyAssetScreen = ({ route }: Props) => {
  const { t } = useTranslation();
  const currency = route?.params?.currency;
  const { colors } = useTheme();
  const useCounterValue = useSelector(countervalueFirstSelector);

  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );

  const assetPortfolio = usePortfolio();

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
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
      <Box mt={6} onLayout={onAssetCardLayout}>
        <AssetCentricGraphCard
          assetPortfolio={assetPortfolio}
          counterValueCurrency={counterValueCurrency}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          currency={currency}
          currencyBalance={0}
          areAccountsEmpty={true}
        />
      </Box>,
      <SectionContainer px={6}>
        <SectionTitle
          title={t("account.quickActions")}
          containerProps={{ mb: 6 }}
        />
        <FabAssetActions currency={currency} />
      </SectionContainer>,
      <EmptyAccountCard currencyTicker={currency.ticker} />,
      <SectionContainer px={6}>
        <SectionTitle
          title={t("portfolio.marketPriceSection.title", {
            currencyTicker: currency.ticker,
          })}
        />
        <MarketPriceSection currency={currency} />
      </SectionContainer>,
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
      hasOrderedNano,
    ],
  );

  return (
    <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
      <CurrencyBackgroundGradient
        currentPositionY={currentPositionY}
        graphCardEndPosition={graphCardEndPosition}
        gradientColor={getCurrencyColor(currency) || colors.primary.c80}
      />
      <AnimatedFlatListWithRefreshControl
        style={{ flex: 1, paddingTop: 48, marginBottom: 40 }}
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
        currencyBalance={0}
        counterValueCurrency={counterValueCurrency}
      />
    </TabBarSafeAreaView>
  );
};

export default withDiscreetMode(ReadOnlyAssetScreen);
