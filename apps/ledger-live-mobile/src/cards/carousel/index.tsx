import { Flex } from "@ledgerhq/native-ui";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import Bullet from "./bullets";
import { CarouselItem } from "./utils";

const width = Dimensions.get("screen").width;

type Props<P> = {
  items: CarouselItem<P>[];

  //
  gap?: number;
};

/**
 *
 */
const Carousel = <P,>({ items: initialItems, gap = 6 }: Props<P>) => {
  const { space } = useTheme();

  const carouselRef = useRef<ScrollView>(null);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [items, setItems] = useState(initialItems.filter(item => item.props.metadata.displayed));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / e.nativeEvent.layoutMeasurement.width);

    if (newIndex !== carouselIndex) {
      setCarouselIndex(newIndex);
    }
  };

  useEffect(() => {
    setItems(() => initialItems.filter(item => item.props.metadata.displayed));
  }, [...initialItems.map(item => item.props.metadata?.displayed)]);

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <ScrollView
        style={{ flex: 1 }}
        ref={carouselRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        snapToInterval={width}
        decelerationRate={0}
      >
        {items.map(item => (
          <Animated.View
            key={item.props.metadata.id}
            entering={FadeIn}
            exiting={FadeOut}
            layout={Layout.delay(100)}
            style={{ width, flex: 1, paddingHorizontal: space[gap] }}
          >
            {<item.component {...item.props} />}
          </Animated.View>
        ))}
      </ScrollView>

      <Flex flexDirection="row" columnGap={4} justifyContent="center">
        {items.map((item, index) => (
          <Bullet
            key={item.props.metadata.id}
            type={
              index === carouselIndex
                ? "active"
                : Math.abs(index - carouselIndex) === 1
                ? "nearby"
                : "far"
            }
          />
        ))}
      </Flex>
    </View>
  );
};

export default Carousel;
