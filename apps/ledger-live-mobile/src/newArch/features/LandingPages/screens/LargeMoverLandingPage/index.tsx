import { Flex } from "@ledgerhq/native-ui";
import React, { useState, useMemo } from "react";
import { useLargeMover } from "./hooks/useLargeMover";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Card } from "./components/Card";
import { LandingPagesNavigatorParamList } from "~/components/RootNavigator/types/LandingPagesNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { StickyHeader } from "./components/StickyHeader";
import { SafeAreaView } from "react-native";
import { useTheme } from "styled-components/native";
import { getCurrencyIdsFromTickers, rangeMap } from "./utils";
import { SwiperComponent } from "LLM/components/Swiper/components/Swiper";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import { LoadingIndicator } from "./components/Loading";
import { CardType } from "./types";
import { track, TrackScreen } from "~/analytics";
import { PAGE_NAME } from "./const";
import { useLargeMoverChartData } from "@ledgerhq/live-common/market/hooks/useLargeMoverChartData";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { OverlayTutorial } from "./components/OverlayTutorial";
import { useSelector } from "react-redux";
import { tutorialSelector } from "~/reducers/largeMover";

type LargeMoverLandingPageProps = StackNavigatorProps<
  LandingPagesNavigatorParamList,
  ScreenName.LargeMoverLandingPage
>;

export const LargeMoverLandingPage = ({ route }: LargeMoverLandingPageProps) => {
  const { currencyIds, initialRange = "day" } = route.params;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const currencyIdsArray = currencyIds.toUpperCase().split(",");
  const currenciesIds = getCurrencyIdsFromTickers(currencyIdsArray);
  const [range, setRange] = useState<KeysPriceChange>(rangeMap[initialRange]);

  const { currencies, loading, isError } = useLargeMover({
    currenciesIds,
  });

  const { chartDataArray, loadingChart } = useLargeMoverChartData({
    ids: currenciesIds,
    counterCurrency: counterValueCurrency.ticker,
    range,
  });

  const navigation = useNavigation<NavigationProp<WalletTabNavigatorStackParamList>>();

  const { colors } = useTheme();
  const height = getWindowDimensions().height * 0.78;
  const [currentIndex, setCurrentIndex] = useState(0);
  const showOverlay = useSelector(tutorialSelector);
  const handleSwipe = (newIndex: number) => {
    const from = currenciesWithId[currentIndex].data?.name;
    const to = currenciesWithId[newIndex].data?.name;

    track("large_mover_swipe", {
      page: PAGE_NAME,
      button: "Swipe",
      from,
      to,
    });

    setCurrentIndex(newIndex);
  };
  const currenciesWithId = useMemo(
    () =>
      currencies.map((currency, index) => {
        const chartDataEntry = chartDataArray.find(
          chartData => chartData.idChartData === currency.id,
        );
        return {
          id: currency.id,
          data: currency.data,
          chartData: chartDataEntry?.chartData,
          loading: loadingChart,
          idCard: index,
        };
      }),
    [chartDataArray, currencies, loadingChart],
  );
  const renderCard = (card: CardType) => {
    if (!card.data) return null;

    const chartDataEntry = chartDataArray.find(c => c.idChartData === card.id);

    return (
      <Card
        data={card.data}
        chartData={chartDataEntry?.chartData}
        loading={loadingChart}
        height={height}
        range={range}
        setRange={setRange}
        currentIndex={currentIndex}
      />
    );
  };

  if (isError) {
    navigation.navigate(NavigatorName.Market, {
      screen: ScreenName.MarketList,
      params: { top100: true },
    });
  }
  return (
    <>
      {showOverlay && !loading && <OverlayTutorial />}
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.c00, paddingTop: 40 }}>
        <TrackScreen name={PAGE_NAME} initialRange={initialRange} currencyIds={currencyIds} />
        <StickyHeader />
        <Flex paddingTop={25}>
          {loading && loadingChart ? (
            <LoadingIndicator height={height} />
          ) : (
            <Flex>
              <SwiperComponent
                cardContainerStyle={{ justifyContent: "flex-start" }}
                currentIndex={currentIndex}
                onIndexChange={handleSwipe}
                initialCards={currenciesWithId}
                renderCard={renderCard}
              />
            </Flex>
          )}
        </Flex>
      </SafeAreaView>
    </>
  );
};
