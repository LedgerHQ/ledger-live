import React, { memo, useMemo, useCallback, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from "react-native";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { width } from "~/helpers/normalizeSize";
import CarouselCard from "./CarouselCard";

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
        <CarouselCard
          key={cardProps.id + index}
          id={cardProps.id}
          cardProps={cardProps}
          index={index}
          width={cardsWidth}
        />
      ))}
    </ScrollView>
  );
};

export default memo(Carousel);
