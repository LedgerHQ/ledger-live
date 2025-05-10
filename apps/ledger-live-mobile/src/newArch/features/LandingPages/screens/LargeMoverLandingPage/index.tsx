import { Flex, InfiniteLoader, Text, Button } from "@ledgerhq/native-ui";
import React, { useState } from "react";
import { useLargeMover } from "./hooks/useLargeMover";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Card } from "./components/Card";
import { LandingPagesNavigatorParamList } from "~/components/RootNavigator/types/LandingPagesNavigator";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

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
    <Flex>
      <Button onPress={handleNext}>{"Next"}</Button>
      <Flex padding={1} paddingBottom={120} paddingTop={8}>
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
  );
};
