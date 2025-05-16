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
import { rangeMap } from "./utils";
import { SwiperComponent } from "~/newArch/components/Swiper/components/Swiper";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import { LoadingIndicator } from "./components/Loading";
import { CardType } from "./types";
type LargeMoverLandingPageProps = StackNavigatorProps<
  LandingPagesNavigatorParamList,
  ScreenName.LargeMoverLandingPage
>;

export const LargeMoverLandingPage = ({ route }: LargeMoverLandingPageProps) => {
  const { currencyIds, initialRange = "day" } = route.params;
  const currencyIdsArray = currencyIds.toUpperCase().split(",");
  const initialKeyRange = rangeMap[initialRange];
  const { range, setRange, currencies, loading, isError } = useLargeMover({
    currencyIdsArray,
    initialKeyRange,
  });

  const navigation = useNavigation<NavigationProp<WalletTabNavigatorStackParamList>>();

  const { colors } = useTheme();
  const height = getWindowDimensions().height * 0.75;
  const [currentIndex, setCurrentIndex] = useState(0);

  const currenciesWithId = useMemo(
    () =>
      currencies.map((currency, index) => ({
        data: currency.data,
        chartData: currency.chartData,
        idCard: index,
        range,
        setRange,
      })),
    [currencies, range, setRange],
  );

  const renderCard = (card: CardType) => {
    if (!card.data || !card.chartData) {
      return null;
    }

    return (
      <Card
        data={card.data}
        chartData={card.chartData}
        range={range}
        setRange={setRange}
        height={height}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.c00 }}>
      <StickyHeader />
      <Flex paddingTop={40}>
        {loading ? (
          <LoadingIndicator height={height} />
        ) : (
          <SwiperComponent
            cardContainerStyle={{ justifyContent: "flex-start" }}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
            initialCards={currenciesWithId}
            renderCard={renderCard}
          />
        )}
      </Flex>
    </SafeAreaView>
  );
};
