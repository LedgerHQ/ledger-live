import React, { useEffect, useState, useRef, useCallback } from "react";
import { Platform, ScrollView, ViewProps, NativeScrollEvent } from "react-native";
import styled from "styled-components/native";
import { Flex, SlideIndicator } from "../index";
import type { Props as FlexboxProps } from "../Layout/Flex";

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
}>;

function Carousel({
  activeIndex,
  autoDelay,
  containerProps,
  slideIndicatorContainerProps,
  scrollViewProps,
  onChange,
  children,
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
    (index, animated = true) => {
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
    if (init && activeIndex) scrollToIndex(activeIndex, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  useEffect(() => {
    if (scrollToIndex && typeof activeIndex === "number") {
      scrollToIndex(activeIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const onContentSizeChange = (contentWidth: number, contentHeight: number) => {
    dimensions.current = { contentWidth, contentHeight };
    setInit(true);
  };

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

    const interval = setInterval(() => {
      if (!disableTimer.current) {
        setActiveIndexState((index) => {
          const newIndex = typeof index !== "undefined" ? (index + 1) % slidesLength : 0;
          scrollToIndex(newIndex);
          onChange && onChange(newIndex);
          return newIndex;
        });
      }
    }, autoDelay);

    return () => clearInterval(interval);
  }, [resetTimer, slidesLength, scrollToIndex, onChange, autoDelay]);

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
        contentContainerStyle={{ width: `${fullWidth}%` }}
        decelerationRate="fast"
        {...scrollViewProps}
      >
        {React.Children.map(children, (child, index) => (
          <Flex key={index} flex={1}>
            {child}
          </Flex>
        ))}
      </HorizontalScrollView>
      <Flex my={8} {...slideIndicatorContainerProps}>
        <SlideIndicator
          activeIndex={activeIndexState || 0}
          onChange={(index) => {
            scrollToIndex(index);
            setResetTimer({});
          }}
          slidesLength={slidesLength}
        />
      </Flex>
    </Flex>
  );
}

export default React.memo(Carousel);
