import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Slides, useSlidesContext } from "@ledgerhq/native-ui";
import { StyleSheet } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { CarouselFooterButton } from "./CarouselFooterButton";
import { CarouselProgressIndicator } from "./CarouselProgressIndicator";
import { CarouselSlideItem } from "./CarouselSlideItem";
import type { CarouselViewModel } from "../screens/useGenericAwarenessModalDrawerViewModel";

type CarouselLayoutProps = Readonly<{
  onClose: () => void;
  viewModel: CarouselViewModel;
}>;

const AnimatedGestureHandlerFlatList = Animated.createAnimatedComponent(FlatList);

const DEFAULT_LINE_COUNT = 1;

export function CarouselLayout({ onClose, viewModel }: CarouselLayoutProps) {
  const { data: slides } = viewModel.content;
  const [titleLineCounts, setTitleLineCounts] = useState<number[]>(() =>
    slides.map(() => DEFAULT_LINE_COUNT),
  );
  const [subtitleLineCounts, setSubtitleLineCounts] = useState<number[]>(() =>
    slides.map(() => DEFAULT_LINE_COUNT),
  );

  const maxTitleLineCount = useMemo(
    () => Math.max(DEFAULT_LINE_COUNT, ...titleLineCounts),
    [titleLineCounts],
  );
  const maxSubtitleLineCount = useMemo(
    () => Math.max(DEFAULT_LINE_COUNT, ...subtitleLineCounts),
    [subtitleLineCounts],
  );

  const handleTitleTextLayout = useCallback((slideIndex: number, lineCount: number) => {
    setTitleLineCounts(currentTitleLineCounts => {
      const nextTitleLineCounts = [...currentTitleLineCounts];
      const currentLineCount = nextTitleLineCounts[slideIndex] ?? DEFAULT_LINE_COUNT;

      nextTitleLineCounts[slideIndex] = Math.max(currentLineCount, lineCount);
      return nextTitleLineCounts;
    });
  }, []);

  const handleSubtitleTextLayout = useCallback((slideIndex: number, lineCount: number) => {
    setSubtitleLineCounts(currentSubtitleLineCounts => {
      const nextSubtitleLineCounts = [...currentSubtitleLineCounts];
      const currentLineCount = nextSubtitleLineCounts[slideIndex] ?? DEFAULT_LINE_COUNT;

      nextSubtitleLineCounts[slideIndex] = Math.max(currentLineCount, lineCount);
      return nextSubtitleLineCounts;
    });
  }, []);

  return (
    <Slides
      style={{ flex: 1 }}
      as={AnimatedGestureHandlerFlatList}
      testID="generic-awareness-modal-carousel-slides"
    >
      <Slides.Content style={{ flex: 1 }}>
        {slides.map((slide, slideIndex) => (
          <Slides.Content.Item key={slideIndex}>
            <CarouselSlideItem
              {...slide}
              isFirstSlide={slideIndex === 0}
              titleLineCount={maxTitleLineCount}
              onTitleTextLayout={lineCount => handleTitleTextLayout(slideIndex, lineCount)}
              subtitleLineCount={maxSubtitleLineCount}
              onSubtitleTextLayout={lineCount => handleSubtitleTextLayout(slideIndex, lineCount)}
            />
          </Slides.Content.Item>
        ))}
      </Slides.Content>

      <Slides.ProgressIndicator style={styles.progressIndicator}>
        <CarouselProgressIndicator />
      </Slides.ProgressIndicator>

      <Slides.Footer>
        <CarouselSlideViewedTracker onSlideViewed={viewModel.onSlideViewed} />
        <CarouselFooterButton
          slides={slides}
          onClose={onClose}
          onNavigationPress={viewModel.onNavigationPress}
          onPrimaryPress={viewModel.onPrimaryPress}
          onMalformedUrl={viewModel.onMalformedUrl}
        />
      </Slides.Footer>
    </Slides>
  );
}

type CarouselSlideViewedTrackerProps = Readonly<{
  onSlideViewed: (slideIndex: number, isLastSlide: boolean) => void;
}>;

function CarouselSlideViewedTracker({ onSlideViewed }: CarouselSlideViewedTrackerProps) {
  const { currentIndex, totalSlides } = useSlidesContext();

  useEffect(() => {
    onSlideViewed(currentIndex, currentIndex === totalSlides - 1);
  }, [currentIndex, onSlideViewed, totalSlides]);

  return null;
}

const styles = StyleSheet.create({
  progressIndicator: {
    marginTop: 24,
    marginBottom: 24,
  },
});
