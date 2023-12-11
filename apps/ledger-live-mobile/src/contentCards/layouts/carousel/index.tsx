import React, { useRef, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { Layout, SlideInRight } from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import { ContentLayoutBuilder } from "~/contentCards/layouts/utils";
import Pagination from "./pagination";
import { ContentCardItem } from "~/contentCards/cards/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = {
  styles?: {
    gap?: number;
    pagination?: boolean;
  };
};

const defaultStyles = {
  gap: 6,
  pagination: true,
};

const Carousel = ContentLayoutBuilder<Props>(({ items, styles = defaultStyles }) => {
  const { width } = useWindowDimensions();

  styles.gap = styles.gap ?? defaultStyles.gap;
  styles.pagination = styles.pagination ?? defaultStyles.pagination;

  const separatorWidth = useTheme().space[styles.gap];

  const carouselRef = useRef<FlatList>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const setIndexOnScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (width - separatorWidth * 1.5));
    if (newIndex !== carouselIndex) setCarouselIndex(newIndex);
  };

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
        data={items}
        ItemSeparatorComponent={() => <View style={{ width: separatorWidth / 2 }} />}
        renderItem={({ item }: ListRenderItemInfo<ContentCardItem>) => (
          <Animated.View
            key={item.props.metadata.id}
            entering={SlideInRight}
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

      {styles.pagination && <Pagination items={items} carouselIndex={carouselIndex} />}
    </View>
  );
});

export default Carousel;
