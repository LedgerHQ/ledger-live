import React, { memo, useCallback, useRef, useState } from "react";
import { ScrollView } from "react-native";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import { width } from "../../helpers/normalizeSize";
import CarouselCard from "./CarouselCard";

const WIDTH = width * 0.85;

type Props = {
  cardsVisibility: { [key: string]: boolean };
};

const Carousel = ({ cardsVisibility }: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPositionX, setCurrentPositionX] = useState(0);

  const { walletCards } = useDynamicContent();

  const onScrollEnd = useCallback(event => {
    setCurrentPositionX(
      event.nativeEvent.contentOffset.x +
        event.nativeEvent.layoutMeasurement.width,
    );
  }, []);

  const onScrollViewContentChange = useCallback(
    contentWidth => {
      if (currentPositionX > contentWidth) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    },
    [currentPositionX],
  );

  if (!walletCards || !walletCards.length) {
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
      {walletCards.map((cardProps, index) => (
        <CarouselCard
          key={cardProps.id + index}
          id={cardProps.id}
          cardProps={cardProps}
          index={index}
          width={WIDTH}
        />
      ))}
    </ScrollView>
  );
};

export default memo<Props>(Carousel);
