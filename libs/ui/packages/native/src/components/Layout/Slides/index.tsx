import React, {
  createContext,
  ReactNode,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
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
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

export const SlidesContext = createContext<{
  currentIndex: number;
  totalSlides: number;
  goToNext: () => void;
  goToPrevious: () => void;
  goToSlide: (index: number) => void;
  flatListRef: React.RefObject<FlatList<React.ReactElement> | null>;
  scrollProgressSharedValue: ReturnType<typeof useSharedValue<number>>;
  footerHeights: Map<number, number>;
  setFooterHeight: (slideIndex: number, footerHeight: number) => void;
} | null>(null);
export const useSlidesContext = () => {
  const context = useContext(SlidesContext);
  if (!context) {
    throw new Error("useSlidesContext must be used within a Slides component");
  }
  return context;
};

type SlidesProps = {
  children: ReactNode;
  onSlideChange?: (index: number) => void;
  initialSlide?: number;
  style?: ViewStyle;
  /**
   * Custom component to use instead of the default AnimatedFlatList.
   * For instance, inside gorhom/bottom-sheet, we need to pass FlatList from react-native-gesture-handler.
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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
export function Slides({
  children,
  onSlideChange,
  initialSlide = 0,
  style,
  as = AnimatedFlatList,
  ...flatListProps
}: SlidesProps) {
  const ListComponent = as;
  const flatListRef = useRef<FlatList>(null);
  const [width, setWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(initialSlide);
  const [footerHeights, setFooterHeights] = useState<Map<number, number>>(new Map());
  const scrollProgressSharedValue = useSharedValue(initialSlide);

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
            initialScrollIndex={initialSlide}
            {...flatListProps}
          />
        )}
        {progressIndicatorChildren.length > 0 && progressIndicatorChildren}
      </View>
    </SlidesContext.Provider>
  );
}

const SlideContext = createContext<{
  slideIndex: number;
} | null>(null);
export const useSlideContext = () => {
  const context = useContext(SlideContext);
  if (!context) {
    throw new Error("useSlideContext must be used within a Slide component");
  }
  return context;
};

const SlideComponent = (props: React.ComponentProps<typeof View>) => {
  return <View {...props} style={[styles.slide, props.style]} />;
};

function SlideBody(props: React.ComponentProps<typeof View>) {
  return <View {...props} style={[styles.body, props.style]} />;
}

function SlideFooter(props: React.ComponentProps<typeof View>) {
  const { setFooterHeight } = useSlidesContext();
  const { slideIndex } = useSlideContext();

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      setFooterHeight(slideIndex, height);
    },
    [setFooterHeight, slideIndex],
  );

  return <View {...props} style={[styles.footer, props.style]} onLayout={handleLayout} />;
}

function ProgressIndicator(props: React.ComponentProps<typeof Animated.View>) {
  const { scrollProgressSharedValue, footerHeights, totalSlides } = useSlidesContext();

  const { inputRange, outputRange, hasValidHeights } = useMemo(() => {
    const input: number[] = [];
    const output: number[] = [];

    for (let i = 0; i < totalSlides; i++) {
      input.push(i);
      output.push(footerHeights.get(i) || 0);
    }

    const hasValid = output.some((height) => height > 0);

    return {
      inputRange: input,
      outputRange: output,
      hasValidHeights: hasValid,
    };
  }, [footerHeights, totalSlides]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!hasValidHeights || inputRange.length === 0) {
      return { bottom: 0, opacity: 0 };
    }

    const bottom = interpolate(scrollProgressSharedValue.value, inputRange, outputRange, "clamp");

    return {
      bottom,
      opacity: bottom > 0 ? 1 : 0,
    };
  });

  if (!hasValidHeights) return null;

  return (
    <Animated.View {...props} style={[styles.progressIndicator, animatedStyle, props.style]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingBottom: 16,
  },
  progressIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
});

export function Slide(props: React.ComponentProps<typeof SlideComponent>) {
  return <SlideComponent {...props} />;
}
Slide.Body = SlideBody;
Slide.Footer = SlideFooter;

Slides.Slide = Slide;
Slides.ProgressIndicator = ProgressIndicator;
