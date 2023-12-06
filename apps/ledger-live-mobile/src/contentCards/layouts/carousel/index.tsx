import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeOut, Layout, SlideInRight } from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import Pagination from "./pagination";
import { CarouselItem } from "~/contentCards/layouts/carousel/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props<P = any> = {
  items: CarouselItem<P>[];

  styles?: {
    gap: number;
  };
};

/**
 *
 */
const Carousel = <P,>({ items: initialItems, styles = { gap: 6 } }: Props<P>) => {
  const { width } = useWindowDimensions();
  const separatorWidth = useTheme().space[styles.gap];

  const carouselRef = useRef<FlatList>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselItems, setCarouselItems] = useState(
    initialItems.filter(({ props }) => props.metadata.displayed),
  );

  const setIndexOnScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (width - separatorWidth * 1.5));
    if (newIndex !== carouselIndex) setCarouselIndex(newIndex);
  };

  useEffect(() => {
    setCarouselItems(() => initialItems.filter(({ props }) => props.metadata.displayed));
  }, [initialItems]);

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <FlatList
        horizontal
        ref={carouselRef}
        showsHorizontalScrollIndicator={false}
        onScroll={setIndexOnScroll}
        disableIntervalMomentum
        scrollEventThrottle={16}
        bounces={false}
        snapToInterval={width - separatorWidth * 1.5}
        decelerationRate={0}
        contentContainerStyle={{ paddingHorizontal: separatorWidth }}
        //
        data={carouselItems}
        ItemSeparatorComponent={() => <View style={{ width: separatorWidth / 2 }} />}
        renderItem={({ item }) => (
          <Animated.View
            key={item.props.metadata.id}
            entering={SlideInRight}
            exiting={FadeOut.duration(100)}
            layout={Layout.duration(100)}
            style={{
              width: width - separatorWidth * 2,
              flex: 1,
            }}
          >
            {<item.component {...item.props} />}
          </Animated.View>
        )}
      />

      <Pagination items={carouselItems} carouselIndex={carouselIndex} />
    </View>
  );
};

export default Carousel;
