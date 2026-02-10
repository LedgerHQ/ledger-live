import React, { useCallback, useMemo, useState } from "react";
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

import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { SlidesContext } from "./context";
import { ProgressIndicator, type ProgressIndicatorElement } from "./ProgressIndicator";
import { Slide, type SlideElement } from "./Slide";
import { Content, type ContentElement } from "./Content";
import { Footer, type FooterElement } from "./Footer";
import { isElementOfType } from "./utils";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

type SlidesChild = ContentElement | FooterElement | ProgressIndicatorElement;

export type SlidesProps = {
  children: SlidesChild | SlidesChild[];
  onSlideChange?: (index: number) => void;
  initialSlideIndex?: number;
  style?: ViewStyle;
  /**
   * Custom component to use instead of the default AnimatedFlatList.
   * For instance, inside gorhom/bottom-sheet, we need to pass FlatList from react-native-gesture-handler.
   * Make sure it is wrapped in Animated.createAnimatedComponent
   */
  as?: typeof AnimatedFlatList;
  testID?: string;
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
  testID,
  as = AnimatedFlatList,
  ...flatListProps
}: SlidesProps) {
  const ListComponent = as;
  const flatListRef = useAnimatedRef<FlatList>();
  const [width, setWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const scrollProgressSharedValue = useSharedValue(initialSlideIndex);

  const handleContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width: containerWidth } = event.nativeEvent.layout;
      if (containerWidth > 0 && containerWidth !== width) {
        setWidth(containerWidth);
      }
    },
    [width],
  );

  const slideChildren: SlideElement[] = useMemo(() => {
    const content = React.Children.toArray(children).find((child): child is ContentElement =>
      isElementOfType(child, Content),
    );

    if (!content) {
      return [];
    }

    return React.Children.toArray(content.props.children).filter((child): child is SlideElement =>
      isElementOfType(child, Slide),
    );
  }, [children]);

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
      return <View style={{ width, flex: 1 }}>{info.item}</View>;
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
    }),
    [currentIndex, totalSlides, goToNext, goToPrevious, goToSlide],
  );

  const renderOrderedChildren = useCallback(() => {
    return React.Children.map(children, (child) => {
      if (isElementOfType(child, Content)) {
        if (width <= 0) {
          return null;
        }
        return (
          <ListComponent
            key="slides-content"
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
        );
      }

      if (isElementOfType(child, Footer) || isElementOfType(child, ProgressIndicator)) {
        return child;
      }

      return null;
    });
  }, [
    children,
    width,
    slideChildren,
    renderItem,
    scrollHandler,
    handleMomentumScrollEnd,
    getItemLayout,
    initialSlideIndex,
    flatListProps,
    ListComponent,
    flatListRef,
  ]);

  return (
    <SlidesContext.Provider value={contextValue}>
      <View testID={testID} style={[styles.container, style]} onLayout={handleContainerLayout}>
        {renderOrderedChildren()}
      </View>
    </SlidesContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
