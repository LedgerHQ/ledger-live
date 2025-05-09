import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import React, { useState, useMemo } from "react";
import { useLargeMover } from "./hooks/useLargeMover";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Card } from "./components/Card";
import { LandingPagesNavigatorParamList } from "~/components/RootNavigator/types/LandingPagesNavigator";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { StickyHeader } from "./components/StickyHeader";
import { SafeAreaView } from "react-native";
import { useTheme } from "styled-components/native";
import { rangeMap } from "./utils";
import { SwiperComponent } from "~/newArch/components/Swiper/components/Swiper";

type LargeMoverLandingPageProps = StackNavigatorProps<
  LandingPagesNavigatorParamList,
  ScreenName.LargeMoverLandingPage
>;

export const LargeMoverLandingPage = ({ route }: LargeMoverLandingPageProps) => {
  const { currencyIds, initialRange = "day" } = route.params;
  const currencyIdsArray = currencyIds.toUpperCase().split(",");
  const initialKeyRange = rangeMap[initialRange];
  const { range, setRange, currencies, loading } = useLargeMover({
    currencyIdsArray,
    initialKeyRange,
  });

  const { colors } = useTheme();
  const height = getWindowDimensions().height * 0.75;
  const [currentIndex, setCurrentIndex] = useState(0);

  const currenciesWithId = useMemo(
    () =>
      currencies.map((currency, index) => ({
        ...currency,
        idCard: index,
      })),
    [currencies],
  );

  if (loading) {
    return (
      <Flex height={height} width="100%" justifyContent="center" alignItems="center">
        <InfiniteLoader color="primary.c50" size={38} />
      </Flex>
    );
  }

  if (currencies.length === 0) {
    return (
      <Flex>
        <Text>{"No data available"}</Text>
      </Flex>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.c00 }}>
      <StickyHeader />
      <Flex paddingTop={20}>
        {currencies[0].data && currencies[0].chartData ? (
          <SwiperComponent
            cardContainerStyle={{ justifyContent: "flex-start" }}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
            initialCards={currenciesWithId}
            renderCard={card => (
              <Card {...card.data!} chartData={card.chartData!} range={range} setRange={setRange} />
            )}
          />
        ) : null}
      </Flex>
    </SafeAreaView>
  );
};
