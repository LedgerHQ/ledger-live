import { Flex, InfiniteLoader, Text, Button } from "@ledgerhq/native-ui";
import React, { useState } from "react";
import { useLargeMover } from "./hooks/useLargeMover";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Card } from "./components/Card";
import { LandingPagesNavigatorParamList } from "~/components/RootNavigator/types/LandingPagesNavigator";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { StickyHeader } from "./components/StickyHeader";
import { SafeAreaView } from "react-native";
import { useTheme } from "styled-components/native";

type LargeMoverLandingPageProps = StackNavigatorProps<
  LandingPagesNavigatorParamList,
  ScreenName.LargeMoverLandingPage
>;

export const LargeMoverLandingPage = ({ route }: LargeMoverLandingPageProps) => {
  const { currencyIds, initialRange } = route.params;
  const { range, setRange, currencies, loading } = useLargeMover({
    currencyIds,
    initialRange,
  });

  const { colors } = useTheme();
  const height = getWindowDimensions().height * 0.75;

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % currencies.length);
  };

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
      <Flex width="100%" flex={1}>
        <StickyHeader />
        <Button onPress={handleNext} size="large">
          {"Next"}
        </Button>
        <Flex padding={1}>
          {currencies[currentIndex].data && currencies[currentIndex].chartData ? (
            <Card
              {...currencies[currentIndex].data!}
              chartData={currencies[currentIndex].chartData!}
              range={range}
              setRange={setRange}
            />
          ) : null}
        </Flex>
      </Flex>
    </SafeAreaView>
  );
};
