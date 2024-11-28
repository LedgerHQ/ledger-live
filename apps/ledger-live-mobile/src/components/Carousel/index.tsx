import React, { memo, useMemo, useCallback, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from "react-native";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { width } from "~/helpers/normalizeSize";
import CarouselCard from "./CarouselCard";
import { IsInViewContextProvider } from "LLM/contexts/IsInViewContext";
import LogContentCardWrapper from "LLM/features/DynamicContent/components/LogContentCardWrapper";

const WIDTH = width * 0.85;

const Carousel = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPositionX, setCurrentPositionX] = useState(0);

  const { walletCardsDisplayed } = useDynamicContent();

  const onScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentPositionX(
      event.nativeEvent.contentOffset.x + event.nativeEvent.layoutMeasurement.width,
    );
  }, []);

  const onScrollViewContentChange = useCallback(
    (contentWidth: number) => {
      if (currentPositionX > contentWidth) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    },
    [currentPositionX],
  );

  const cardsWidth = useMemo(
    () => (walletCardsDisplayed.length === 1 ? width - 32 : WIDTH),
    [walletCardsDisplayed],
  );

  if (!walletCardsDisplayed || !walletCardsDisplayed.length) {
    // No slides or dismissed, no problem
    return null;
  }

  return (
    <IsInViewContextProvider>
      <ScrollView
        horizontal
        ref={scrollViewRef}
        onMomentumScrollEnd={onScrollEnd}
        onContentSizeChange={onScrollViewContentChange}
        showsHorizontalScrollIndicator={false}
        snapToInterval={WIDTH + 16}
        decelerationRate={"fast"}
      >
        {walletCardsDisplayed.map((cardProps, index) => (
          <LogContentCardWrapper key={cardProps.id + index} id={cardProps.id}>
            <CarouselCard
              key={cardProps.id + index}
              id={cardProps.id}
              cardProps={cardProps}
              index={index}
              width={cardsWidth}
            />
          </LogContentCardWrapper>
        ))}
      </ScrollView>
    </IsInViewContextProvider>
  );
};

export default memo(Carousel);
