import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  ViewToken,
  useWindowDimensions,
} from "react-native";
import Animated, { LinearTransition, SlideInRight } from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import { ContentLayoutBuilder } from "~/contentCards/layouts/utils";
import Pagination from "./pagination";
import { ContentCardItem } from "~/contentCards/cards/types";
import { WidthFactor } from "~/contentCards/layouts/types";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { useInViewContext } from "LLM/contexts/InViewContext";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";

const CONTAINER_IMPRESSION_THRESHOLD = 0.8;

type Props = {
  styles?: {
    gap?: number;
    pagination?: boolean;
    widthFactor?: WidthFactor;
  };
};

const defaultStyles = {
  gap: 6,
  pagination: false,
  widthFactor: WidthFactor.Full,
};

const Carousel = ContentLayoutBuilder<Props>(({ items, styles: _styles = defaultStyles }) => {
  const styles = {
    gap: _styles.gap ?? defaultStyles.gap,
    pagination: _styles.pagination ?? defaultStyles.pagination,
    widthFactor: _styles.widthFactor ?? defaultStyles.widthFactor,
  };

  const width = useWindowDimensions().width * styles.widthFactor;

  const isFullWidth = styles.widthFactor === WidthFactor.Full;

  const separatorWidth = useTheme().space[styles.gap];

  const isPaginationEnabled = styles.pagination;

  const carouselRef = useRef<FlatList>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const setIndexOnScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (width - separatorWidth * 1.5));
    if (newIndex !== carouselIndex) setCarouselIndex(newIndex);
  };

  const viewRef = useRef<View | null>(null);
  const isInViewRef = useRef(false);
  const isContainerVisibleRef = useRef(false);
  const visibleCardsRef = useRef<string[]>([]);
  const { logImpressionCard } = useDynamicContent();
  useInViewContext(
    ({ isInView, progressRatio }) => {
      isInViewRef.current = isInView;
      if (isInView) visibleCardsRef.current.forEach(id => logImpressionCard(id));

      const isNowVisible = progressRatio >= CONTAINER_IMPRESSION_THRESHOLD;
      if (isNowVisible && !isContainerVisibleRef.current) {
        const page = currentRouteNameRef.current ?? "";
        visibleCardsRef.current.forEach(id => {
          const item = items.find(i => i.props.metadata.id === id);
          if (item?.props.location) {
            track("container_impression", { page, location: item.props.location });
          }
        });
      }
      isContainerVisibleRef.current = isNowVisible;
    },
    [logImpressionCard, items],
    viewRef,
  );
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ContentCardItem>[] }) => {
      const visibleCards = viewableItems.map(({ item }) => item.props.metadata.id);
      const newlyVisibleCards = visibleCards.filter(id => !visibleCardsRef.current.includes(id));
      visibleCardsRef.current = visibleCards;
      if (isInViewRef.current) newlyVisibleCards.forEach(id => logImpressionCard(id));
    },
    [logImpressionCard],
  );

  return (
    <View ref={viewRef} style={{ flex: 1, gap: 8 }}>
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
        contentContainerStyle={{
          paddingHorizontal: isFullWidth ? separatorWidth : separatorWidth / 2,
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onViewableItemsChanged={handleViewableItemsChanged}
        data={items}
        ItemSeparatorComponent={() => <View style={{ width: separatorWidth / 2 }} />}
        renderItem={({ item }: ListRenderItemInfo<ContentCardItem>) => (
          <Animated.View
            key={item.props.metadata.id}
            entering={SlideInRight}
            layout={LinearTransition.duration(100)}
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
