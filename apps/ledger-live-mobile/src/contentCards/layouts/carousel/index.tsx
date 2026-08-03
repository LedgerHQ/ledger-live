import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Box, PageIndicator } from "@ledgerhq/lumen-ui-rnative";

const CONTAINER_IMPRESSION_THRESHOLD = 0.8;
const LEADING_SLIDE_KEY = "content-cards-carousel-leading";

type Props = {
  showLumenPageIndicator?: boolean;
  disableVerticalStretch?: boolean;
  leadingSlide?: React.ReactNode;
  styles?: {
    gap?: number;
    pagination?: boolean;
    widthFactor?: WidthFactor;
  };
};

type CarouselListItem =
  | { kind: "leading"; key: string; node: React.ReactNode }
  | { kind: "card"; key: string; item: ContentCardItem };

const defaultStyles = {
  gap: 6,
  pagination: false,
  widthFactor: WidthFactor.Full,
};

const Carousel = ContentLayoutBuilder<Props>(
  ({
    items,
    showLumenPageIndicator = false,
    disableVerticalStretch = false,
    leadingSlide,
    styles: _styles = defaultStyles,
  }) => {
    const styles = {
      gap: _styles.gap ?? defaultStyles.gap,
      pagination: _styles.pagination ?? defaultStyles.pagination,
      widthFactor: _styles.widthFactor ?? defaultStyles.widthFactor,
    };

    const width = useWindowDimensions().width * styles.widthFactor;

    const isFullWidth = styles.widthFactor === WidthFactor.Full;

    const theme = useTheme();
    const separatorWidth = theme.space[styles.gap];

    const listData = useMemo<CarouselListItem[]>(() => {
      const cards: CarouselListItem[] = items.map(item => ({
        kind: "card",
        key: item.props.metadata.id,
        item,
      }));
      if (!leadingSlide) return cards;
      return [{ kind: "leading", key: LEADING_SLIDE_KEY, node: leadingSlide }, ...cards];
    }, [items, leadingSlide]);

    const listDataKeys = useMemo(() => listData.map(item => item.key).join("|"), [listData]);

    const isPaginationEnabled = styles.pagination && !showLumenPageIndicator;
    const showDots = showLumenPageIndicator && listData.length > 1;
    // Match Braze TopWallet spacing: room between slide and PageIndicator (avoid tight dots).
    const carouselGap = showDots ? 12 : 8;

    const carouselRef = useRef<FlatList>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    // TopWallet: size the track to the tallest slide (e.g. LNS 2-line description) so nothing crops.
    const slideHeightsRef = useRef<Record<string, number>>({});
    const [trackHeight, setTrackHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
      slideHeightsRef.current = {};
      setTrackHeight(undefined);
      setCarouselIndex(0);
      carouselRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [listDataKeys]);

    const handleSlideLayout = useCallback(
      (key: string, height: number) => {
        if (!disableVerticalStretch || height <= 0) return;
        if (slideHeightsRef.current[key] === height) return;
        slideHeightsRef.current[key] = height;
        const maxHeight = Math.max(...Object.values(slideHeightsRef.current));
        setTrackHeight(current => (current === maxHeight ? current : maxHeight));
      },
      [disableVerticalStretch],
    );

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
    const findDisplayedPosition = useCallback(
      (id: string) => {
        const fromMetadata = items.find(i => i.props.metadata.id === id)?.props.metadata
          .displayedPosition;
        if (fromMetadata !== undefined) return fromMetadata;
        const index = items.findIndex(i => i.props.metadata.id === id);
        return index >= 0 ? index : undefined;
      },
      [items],
    );

    useInViewContext(
      ({ isInView, progressRatio }) => {
        isInViewRef.current = isInView;
        if (isInView)
          visibleCardsRef.current.forEach(id => logImpressionCard(id, findDisplayedPosition(id)));

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
      [logImpressionCard, findDisplayedPosition, items],
      viewRef,
    );
    const handleViewableItemsChanged = useCallback(
      ({ viewableItems }: { viewableItems: ViewToken<CarouselListItem>[] }) => {
        const visibleCards = viewableItems
          .map(({ item }) => (item.kind === "card" ? item.item.props.metadata.id : null))
          .filter((id): id is string => id !== null);
        const newlyVisibleCards = visibleCards.filter(id => !visibleCardsRef.current.includes(id));
        visibleCardsRef.current = visibleCards;
        if (isInViewRef.current)
          newlyVisibleCards.forEach(id => logImpressionCard(id, findDisplayedPosition(id)));
      },
      [logImpressionCard, findDisplayedPosition],
    );

    return (
      <View
        ref={viewRef}
        style={[{ gap: carouselGap }, disableVerticalStretch ? null : { flex: 1 }]}
      >
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
          style={trackHeight != null ? { height: trackHeight } : undefined}
          contentContainerStyle={{
            paddingHorizontal: isFullWidth ? separatorWidth : separatorWidth / 2,
            ...(disableVerticalStretch ? { alignItems: "flex-start" } : null),
          }}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          onViewableItemsChanged={handleViewableItemsChanged}
          data={listData}
          keyExtractor={item => item.key}
          ItemSeparatorComponent={() => <View style={{ width: separatorWidth / 2 }} />}
          renderItem={({ item }: ListRenderItemInfo<CarouselListItem>) => (
            <Animated.View
              key={item.key}
              entering={SlideInRight}
              layout={LinearTransition.duration(100)}
              onLayout={event => handleSlideLayout(item.key, event.nativeEvent.layout.height)}
              style={{
                width: width - separatorWidth * 2,
                ...(disableVerticalStretch ? null : { flex: 1 }),
                justifyContent: "flex-start",
              }}
            >
              {item.kind === "leading" ? item.node : <item.item.component {...item.item.props} />}
            </Animated.View>
          )}
        />

        {isPaginationEnabled ? (
          leadingSlide ? (
            <Box lx={{ alignItems: "center" }}>
              <PageIndicator
                currentPage={Math.min(carouselIndex + 1, listData.length)}
                totalPages={listData.length}
              />
            </Box>
          ) : (
            <Pagination items={items} carouselIndex={carouselIndex} />
          )
        ) : null}
        {showDots ? (
          <Box lx={{ alignItems: "center" }}>
            <PageIndicator
              currentPage={Math.min(carouselIndex + 1, listData.length)}
              totalPages={listData.length}
            />
          </Box>
        ) : null}
      </View>
    );
  },
);

export default Carousel;
