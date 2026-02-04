import React, { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
  ViewStyle,
  FlatListProps,
} from "react-native";

import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { SlideContext, SlidesContext } from "./context";
import { ProgressIndicator } from "./ProgressIndicator";
import { Slide } from "./Slide";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export type SlidesProps = {
  children: ReactNode;
  onSlideChange?: (index: number) => void;
  initialSlideIndex?: number;
  style?: ViewStyle;
  /**
   * Custom component to use instead of the default AnimatedFlatList.
   * For instance, inside gorhom/bottom-sheet, we need to pass FlatList from react-native-gesture-handler.
   * Make sure it is wrapped in Animated.createAnimatedComponent
   */
  as?: typeof AnimatedFlatList;
} & Omit<
  FlatListProps<React.ReactElement>,
  | "data"
  | "renderItem"
  | "keyExtractor"
  | "horizontal"
  | "pagingEnabled"
  | "showsHorizontalScrollIndicator"
  | "onScroll"
  | "scrollEventThrottle"
  | "onMomentumScrollEnd"
  | "getItemLayout"
  | "initialScrollIndex"
  | "ref"
>;

export function Slides({
  children,
  onSlideChange,
  initialSlideIndex = 0,
  style,
  as = AnimatedFlatList,
  ...flatListProps
}: SlidesProps) {
  const ListComponent = as;
  const flatListRef = useRef<FlatList>(null);
  const [width, setWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [footerHeights, setFooterHeights] = useState<Map<number, number>>(new Map());
  const scrollProgressSharedValue = useSharedValue(initialSlideIndex);

  const setFooterHeight = useCallback((slideIndex: number, footerHeight: number) => {
    setFooterHeights((prev) => {
      const newMap = new Map(prev);
      newMap.set(slideIndex, footerHeight);
      return newMap;
    });
  }, []);

  const handleContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width: containerWidth } = event.nativeEvent.layout;
      if (containerWidth > 0 && containerWidth !== width) {
        setWidth(containerWidth);
      }
    },
    [width],
  );

  const slideChildren: React.ReactElement[] = useMemo(
    () =>
      React.Children.toArray(children).filter(
        (child): child is React.ReactElement => React.isValidElement(child) && child.type === Slide,
      ),
    [children],
  );

  const progressIndicatorChildren = useMemo(
    () =>
      React.Children.toArray(children).filter(
        (child): child is React.ReactElement =>
          React.isValidElement(child) && child.type === ProgressIndicator,
      ),
    [children],
  );

  const totalSlides = slideChildren.length;

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        flatListRef.current?.scrollToIndex({ index, animated: true });
      }
    },
    [totalSlides],
  );

  const goToNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, totalSlides, goToSlide]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }, [currentIndex, goToSlide]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (width > 0) {
        scrollProgressSharedValue.value = event.contentOffset.x / width;
      }
    },
  });

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;

      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / width);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        onSlideChange?.(newIndex);
      }
    },
    [width, currentIndex, onSlideChange],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number): { length: number; offset: number; index: number } => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const renderItem = useCallback(
    (info: { item: React.ReactElement; index: number }): React.ReactElement => {
      return (
        <SlideContext.Provider value={{ slideIndex: info.index }}>
          <View style={{ width, flex: 1 }}>{info.item}</View>
        </SlideContext.Provider>
      );
    },
    [width],
  );

  const contextValue = useMemo(
    () => ({
      currentIndex,
      totalSlides,
      goToNext,
      goToPrevious,
      goToSlide,
      flatListRef,
      scrollProgressSharedValue,
      footerHeights,
      setFooterHeight,
    }),
    [currentIndex, totalSlides, goToNext, goToPrevious, goToSlide, footerHeights, setFooterHeight],
  );

  return (
    <SlidesContext.Provider value={contextValue}>
      <View style={[styles.container, style]} onLayout={handleContainerLayout}>
        {width > 0 && (
          <ListComponent
            ref={flatListRef}
            data={slideChildren}
            renderItem={renderItem}
            keyExtractor={(_: unknown, index: number): string => `slide-${index}`}
            horizontal
            //  @ts-expect-error - pagingEnabled exists but typescript does not seem to know about it
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            getItemLayout={getItemLayout}
            initialScrollIndex={initialSlideIndex}
            {...flatListProps}
          />
        )}
        {progressIndicatorChildren.length > 0 && progressIndicatorChildren}
      </View>
    </SlidesContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
