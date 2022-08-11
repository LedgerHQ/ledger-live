import React, { useMemo, useState, useCallback } from "react";
import { FlatList } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { getAccountCurrency } from "@ledgerhq/live-common/src/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/src/currencies";
import { useTranslation } from "react-i18next";
import { Box } from "@ledgerhq/native-ui";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { accountsSelector } from "../../reducers/accounts";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import MarketPriceSection from "../WalletCentricSections/MarketPrice";
import AssetCentricGraphCard from "../../components/AssetCentricGraphCard";
import CurrencyBackgroundGradient from "../../components/CurrencyBackgroundGradient";
import Header from "./Header";

type RouteParams = {
  currencyId: string;
};

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

const AssetScreen = ({ route }: Props) => {
  const { t } = useTranslation();
  const accounts = useSelector(accountsSelector);
  const { currencyId } = route?.params;
  const currency = getCryptoCurrencyById(currencyId);
  const cryptoAccounts = useMemo(
    () => accounts.filter(a => getAccountCurrency(a).id === currencyId),
    [accounts, currencyId],
  );

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler(event => {
    currentPositionY.value = event.contentOffset.y;
  });

  const onAssetCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

  const data = useMemo(
    () => [
      <Box mx={6} mt={6} onLayout={onAssetCardLayout}>
        <AssetCentricGraphCard />
      </Box>,
      <SectionContainer px={6}>
        <SectionTitle
          title={t("portfolio.marketPriceSection.title", {
            currencyTicker: currency.ticker,
          })}
        />
        <MarketPriceSection currency={currency} />
      </SectionContainer>,
      <SectionContainer px={6} mb={8} isLast>
        <SectionTitle title={t("analytics.operations.title")} />
        <OperationsHistorySection accounts={cryptoAccounts} />
      </SectionContainer>,
    ],
    [cryptoAccounts, currency, t],
  );

  return (
    <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
      <CurrencyBackgroundGradient
        currentPositionY={currentPositionY}
        graphCardEndPosition={graphCardEndPosition}
        gradientColor={getCurrencyColor(currency) || colors.primary.c80}
      />
      <AnimatedFlatListWithRefreshControl
        style={{ flex: 1 }}
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
      />
    </TabBarSafeAreaView>
  );
};

export default withDiscreetMode(AssetScreen);
