import React, { useEffect, useState, useRef, useCallback } from "react";
import { Platform, ScrollView } from "react-native";
import styled from "styled-components/native";
import { Flex, SlideIndicator } from "../index";
import type { Props as FlexboxProps } from "../Layout/Flex";

const HorizontalScrollView = styled.ScrollView.attrs({ horizontal: true })`
  flex: 1;
`;

export type Props = React.PropsWithChildren<{
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
  slideIndicatorContainerProps?: FlexboxProps;
}>;

function Carousel({
  autoDelay,
  containerProps,
  slideIndicatorContainerProps,
  scrollViewProps,
  children,
}: Props) {
  const [, setInit] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const disableTimer = useRef(false);
  const [resetTimer, setResetTimer] = useState({});
  const dimensions = useRef<{
    contentWidth: number;
    contentHeight: number;
  } | null>(null);
  const slidesLength = React.Children.count(children);
  const scrollRef = useRef<ScrollView>(null);

  const fullWidth = 100 * slidesLength;
  const itemWidth = !dimensions.current
    ? 0
    : dimensions.current.contentWidth / slidesLength;

  const scrollToIndex = useCallback(
    (index) => {
      if (scrollRef.current && dimensions.current) {
        scrollRef.current.scrollTo({
          x: itemWidth * index,
          animated: true,
        });
      }
    },
    [itemWidth]
  );

  const onContentSizeChange = useCallback(
    (contentWidth: number, contentHeight: number) => {
      dimensions.current = { contentWidth, contentHeight };
      setInit(true);
    },
    []
  );

  const onScroll = useCallback(
    ({ nativeEvent: { contentOffset, contentSize } }) => {
      const newIndex = Math.abs(
        Math.round((contentOffset.x / contentSize.width) * slidesLength)
      );
      setActiveIndex(newIndex);
    },
    [slidesLength]
  );

  useEffect(() => {
    if (!autoDelay) return;

    const interval = setInterval(() => {
      if (!disableTimer.current) {
        setActiveIndex((index) => {
          const newIndex = (index + 1) % slidesLength;
          scrollToIndex(newIndex);
          return newIndex;
        });
      }
    }, autoDelay);

    return () => clearInterval(interval);
  }, [resetTimer, slidesLength, scrollToIndex, autoDelay]);

  return (
    <Flex
      flex={1}
      width="100%"
      alignItems="center"
      justifyContent="center"
      {...containerProps}
    >
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
          activeIndex={activeIndex}
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

export default Carousel;
