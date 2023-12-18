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

export enum WidthFactor {
  Full = 1,
  Quarter = 0.72,
  Half = 0.5,
}

type Props = {
  styles?: {
    gap?: number;
    pagination?: boolean;
    widthFactor?: WidthFactor;
  };
};

const defaultStyles = {
  gap: 6,
  pagination: true,
  widthFactor: 1,
};

const Carousel = ContentLayoutBuilder<Props>(({ items, styles: _styles = defaultStyles }) => {
  const styles = {
    gap: _styles.gap ?? defaultStyles.gap,
    pagination: _styles.pagination ?? defaultStyles.pagination,
    widthFactor: _styles.widthFactor ?? defaultStyles.widthFactor,
  };

  const width = useWindowDimensions().width * styles.widthFactor;

  const separatorWidth = useTheme().space[styles.gap];

  const isPaginationEnabled = styles.pagination && styles.widthFactor >= WidthFactor.Quarter;

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

      {isPaginationEnabled && <Pagination items={items} carouselIndex={carouselIndex} />}
    </View>
  );
});

export default Carousel;
