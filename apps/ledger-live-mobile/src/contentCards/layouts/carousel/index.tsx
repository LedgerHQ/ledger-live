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

type Props<P> = {
  items: CarouselItem<P>[];

  styles?: {
    gap: number;
  };
};

const defaultStyles: Props<any>["styles"] = { gap: 6 };

/**
 *
 */
const Carousel = <P,>({ items: initialItems, styles = defaultStyles }: Props<P>) => {
  const { width } = useWindowDimensions();
  const separatorWidth = useTheme().space[styles.gap];

  const carouselRef = useRef<FlatList>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselItems, setCarouselItems] = useState(
    initialItems.filter(item => item.props.metadata.displayed),
  );

  const [check, setCheck] = useState(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (width - separatorWidth * 1.5));

    if (!check && newIndex !== carouselIndex) {
      setCarouselIndex(newIndex);
    }
  };

  useEffect(() => {
    // console.log(carouselIndex);
  }, [carouselIndex]);

  useEffect(() => {
    const executeChange = () => {
      setCarouselItems(() => [...initialItems.filter(item => item.props.metadata.displayed)]);
    };

    if (carouselItems.length > 1 && carouselIndex === carouselItems.length - 1) {
      carouselRef.current?.scrollToIndex({
        index: carouselIndex - 1,
        animated: true,
        viewPosition: 0.5,
      });
      setCheck(true);
      setCarouselIndex(carouselIndex - 1);
      setTimeout(() => executeChange(), 300);
      setTimeout(() => setCheck(false), 1000);
    } else {
      //
      executeChange();
    }
  }, [...initialItems.map(item => item.props.metadata?.displayed)]);

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <FlatList
        horizontal
        ref={carouselRef}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
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
            exiting={FadeOut}
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
