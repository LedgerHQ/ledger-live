import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Platform,
  ScrollView,
  ViewProps,
  NativeScrollEvent,
  NativeTouchEvent,
  NativeSyntheticEvent,
} from "react-native";
import styled from "styled-components/native";
import { Flex, SlideIndicator } from "../index";
import type { Props as FlexboxProps } from "../Layout/Flex";
import { I18nManager } from "react-native";

const HorizontalScrollView = styled.ScrollView.attrs({ horizontal: true })`
  flex: 1;
`;

export type Props = React.PropsWithChildren<{
  /**
   * Forces the selection of a specific item of the carousel.
   */
  activeIndex?: number;
  /**
   * Called when the active carousel index is updated.
   */
  onChange?: (index: number) => void;
  /**
   * Called when Carousel try to scroll before the first or after the last item (if restartAfterEnd is false).
   */
  onOverflow?: (side: "start" | "end", fromAutoDelay: boolean) => void;
  /**
   * This number in milliseconds will enable automatic scrolling when defined.
   *
   * The Carousel will scroll to the next item after this delay is elapsed,
   * unless the user is currently dragging the content.
   *
   * This delay will also reset whenever the user taps on an indicator bullet to
   * manually change the carousel item displayed.
   */
  autoDelay?: number;
  /**
   * When the delay is elasped, if the Carousel is at the last item, it will scroll back to the beginning.
   */
  restartAfterEnd?: boolean;
  /**
   * When the user tap on one side of an item, it will scroll to the next or precedent item. Same behavior as Instagram or Snapchat. Default: false.
   */
  scrollOnSidePress?: boolean;
  /**
   * Additional props to pass to the outer container.
   * This container is a Flex element.
   */
  containerProps?: FlexboxProps;
  /**
   * Additional props to pass to the ScrollView element.
   * See: https://reactnative.dev/docs/scrollview
   */
  scrollViewProps?: React.ComponentProps<typeof HorizontalScrollView>;
  /**
   * Additional props to pass to the indicators container.
   * This container is a Flex element.
   */
  slideIndicatorContainerProps?: FlexboxProps & ViewProps;

  IndicatorComponent?:
    | React.ComponentType<{
        activeIndex: number;
        slidesLength: number;
        onChange?: (index: number) => void;
        duration?: number;
      }>
    | React.ReactElement;

  /**
   * Number of milliseconds a tap should not exceed to scroll to the netxt or precedent item.
   */
  maxDurationOfTap?: number;

  /**
   * Called when the active carousel index is updated automaticly.
   */
  onAutoChange?: (index: number) => void;

  /**
   * Called when the active carousel index is updated manually.
   */
  onManualChange?: (index: number) => void;
}>;

/*
In RTL activated, this carousel is making a jump to the last item at start. It's patched by scrolling back to the activeIndex item, but i don't know how to patch this definitely.
It's seems like a behavior that react-native is doing to start from the end of list, except we don't want this kind of RTL behavior as this list is "time based" and need to always stay LTR.
Except a visual jump on RTL layout.
*/
function Carousel({
  activeIndex = 0,
  autoDelay,
  restartAfterEnd = true,
  scrollOnSidePress = false,
  containerProps,
  slideIndicatorContainerProps,
  scrollViewProps,
  onChange,
  onOverflow,
  IndicatorComponent = SlideIndicator,
  maxDurationOfTap,
  children,
  onAutoChange,
  onManualChange,
}: Props) {
  const [init, setInit] = useState(false);
  const [activeIndexState, setActiveIndexState] = useState(activeIndex);
  const disableTimer = useRef(false);
  const [resetTimer, setResetTimer] = useState({});
  const dimensions = useRef<{
    contentWidth: number;
    contentHeight: number;
  } | null>(null);
  const slidesLength = React.Children.count(children);
  const scrollRef = useRef<ScrollView | null>(null);

  const fullWidth = 100 * slidesLength;
  const itemWidth = !dimensions.current ? 0 : dimensions.current.contentWidth / slidesLength;

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      if (scrollRef.current && dimensions.current) {
        scrollRef.current.scrollTo({
          x: itemWidth * index,
          animated,
        });
      }
    },
    [itemWidth],
  );

  useEffect(() => {
    // On init scroll to the active index prop location - if specified.
    if (init && typeof activeIndex === "number") {
      scrollToIndex(activeIndex, false);
    }
  }, [activeIndex, init, scrollToIndex]);

  useEffect(() => {
    if (scrollToIndex && typeof activeIndex === "number") {
      scrollToIndex(activeIndex, false);
    }
  }, [activeIndex, scrollToIndex]);

  const onContentSizeChange = (contentWidth: number, contentHeight: number) => {
    dimensions.current = { contentWidth, contentHeight };
    setInit(true);
  };

  const onTap = useCallback(
    (event: NativeSyntheticEvent<NativeTouchEvent>) => {
      const tapPositionXPercent = event.nativeEvent.locationX / itemWidth;
      if (tapPositionXPercent > 0.25) {
        if (slidesLength > activeIndexState + 1) {
          scrollToIndex(activeIndexState + 1, false);
          onManualChange && onManualChange(activeIndexState + 1);
        } else {
          onOverflow && onOverflow("end", false);
        }
      } else if (activeIndexState > 0) {
        scrollToIndex(activeIndexState - 1, false);
        onManualChange && onManualChange(activeIndexState - 1);
      } else {
        onOverflow && onOverflow("start", false);
      }
    },
    [slidesLength, activeIndexState, scrollToIndex, onOverflow, itemWidth, onManualChange],
  );

  const onScroll = ({
    nativeEvent: { contentOffset, contentSize },
  }: {
    nativeEvent: NativeScrollEvent;
  }) => {
    const newIndex = Math.abs(Math.round((contentOffset.x / contentSize.width) * slidesLength));
    setActiveIndexState(newIndex);
    onChange && onChange(newIndex);
  };

  useEffect(() => {
    if (!autoDelay) return;

    const interval = setTimeout(() => {
      if (!disableTimer.current) {
        const newIndex =
          typeof activeIndexState !== "undefined" ? (activeIndexState + 1) % slidesLength : 0;

        onAutoChange && onAutoChange(newIndex);
        if (restartAfterEnd || newIndex !== 0) {
          scrollToIndex(newIndex);
        } else {
          onOverflow && onOverflow("end", true);
        }
      }
    }, autoDelay);

    return () => {
      return clearTimeout(interval);
    };
  }, [
    resetTimer,
    slidesLength,
    scrollToIndex,
    onChange,
    autoDelay,
    activeIndexState,
    onOverflow,
    restartAfterEnd,
    onAutoChange,
  ]);

  // Timestamp of start of click on the Carrousel
  const [tapTime, setTapTime] = useState<number>(0);
  const onStartTap = useCallback(() => {
    setTapTime(new Date().getTime());
  }, []);
  const onEndTap = useCallback(
    (event: NativeSyntheticEvent<NativeTouchEvent>) => {
      const currentTime: number = new Date().getTime();
      if (!maxDurationOfTap || currentTime - tapTime <= maxDurationOfTap) {
        onTap(event);
      }
    },
    [maxDurationOfTap, onTap, tapTime],
  );

  return (
    <Flex flex={1} width="100%" alignItems="center" justifyContent="center" {...containerProps}>
      <HorizontalScrollView
        ref={scrollRef}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        onScrollBeginDrag={() => {
          disableTimer.current = true;
        }}
        onScrollEndDrag={() => {
          disableTimer.current = false;
        }}
        pagingEnabled={Platform.OS !== "web"}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={200}
        contentContainerStyle={{
          width: `${fullWidth}%`,
          flexDirection: I18nManager.isRTL && Platform.OS !== "ios" ? "row-reverse" : "row",
        }}
        decelerationRate="fast"
        onTouchStart={scrollOnSidePress ? onStartTap : undefined}
        onTouchEnd={scrollOnSidePress ? onEndTap : undefined}
        {...scrollViewProps}
      >
        {React.Children.map(children, (child, index) => (
          <Flex key={index} flex={1}>
            {child}
          </Flex>
        ))}
      </HorizontalScrollView>
      <Flex my={8} {...slideIndicatorContainerProps}>
        {React.isValidElement(IndicatorComponent) ? (
          IndicatorComponent
        ) : (
          /* @ts-expect-error TS 5 can't seem to be able to prove this is a react comopnent here */
          <IndicatorComponent
            activeIndex={activeIndexState || 0}
            onChange={(index: number) => {
              scrollToIndex(index);
              setResetTimer({});
              onManualChange && onManualChange(index);
            }}
            slidesLength={slidesLength}
            duration={autoDelay}
          />
        )}
      </Flex>
    </Flex>
  );
}

export default React.memo(Carousel);
