import React, { useCallback, useMemo } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { LayoutChangeEvent, Linking, StyleSheet } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useTranslation } from "~/context/Locale";
import type { GenericAwarenessModalCarouselSlide } from "@ledgerhq/live-common/genericAwarenessModal";

type CarouselFooterButtonProps = Readonly<{
  slides: GenericAwarenessModalCarouselSlide[];
  onClose: () => void;
}>;

const PRIMARY_BUTTON_SPACING = 12;

const hasPrimaryButton = (slide: GenericAwarenessModalCarouselSlide) =>
  Boolean(slide.primaryButtonLink && slide.primaryButtonLabel);

export function CarouselFooterButton({ slides, onClose }: CarouselFooterButtonProps) {
  const { t } = useTranslation();
  const { currentIndex, goToNext, scrollProgressSharedValue } = useSlidesContext();
  const primaryButtonHeight = useSharedValue(0);
  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;
  const shouldShowPrimaryButton = hasPrimaryButton(currentSlide);
  const slideIndexes = useMemo(() => slides.map((_, index) => index), [slides]);
  const primaryButtonVisibilities = useMemo(
    () => slides.map(slide => (hasPrimaryButton(slide) ? 1 : 0)),
    [slides],
  );
  const primaryButtonAnimatedStyle = useAnimatedStyle(() => {
    const visibility = interpolate(
      scrollProgressSharedValue.value,
      slideIndexes,
      primaryButtonVisibilities,
      "clamp",
    );

    return {
      height: primaryButtonHeight.value * visibility,
      marginTop: primaryButtonHeight.value > 0 ? PRIMARY_BUTTON_SPACING * visibility : 0,
      overflow: "hidden",
    };
  }, [primaryButtonHeight, scrollProgressSharedValue, slideIndexes, primaryButtonVisibilities]);

  const onPrimaryButtonLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);

      if (primaryButtonHeight.value < nextHeight) {
        primaryButtonHeight.value = nextHeight;
      }
    },
    [primaryButtonHeight],
  );

  const onPrimaryPress = async (slide: GenericAwarenessModalCarouselSlide) => {
    if (!slide.primaryButtonLink) {
      return;
    }

    const isExternalLink = slide.primaryButtonLink.startsWith("http");

    try {
      await Linking.openURL(slide.primaryButtonLink);
      if (!isExternalLink) {
        requestAnimationFrame(onClose);
      }
    } catch {
      // TODO: track("malformed_url")
    }
  };

  const onNavigationPress = () => {
    if (!isLastSlide) {
      goToNext();
      return;
    }

    onClose();
  };

  return (
    <Box lx={{ position: "relative" }}>
      <Button appearance="base" size="lg" onPress={onNavigationPress}>
        {isLastSlide ? t("common.close") : t("common.continue")}
      </Button>
      <Box pointerEvents="none" style={styles.primaryButtonMeasurer} accessibilityElementsHidden>
        {slides.map((slide, slideIndex) => {
          if (!hasPrimaryButton(slide)) {
            return null;
          }

          return (
            <Box key={slideIndex} onLayout={onPrimaryButtonLayout}>
              <Button appearance="gray" size="lg" onPress={() => onPrimaryPress(slide)}>
                {slide.primaryButtonLabel}
              </Button>
            </Box>
          );
        })}
      </Box>
      <Animated.View
        style={primaryButtonAnimatedStyle}
        pointerEvents={shouldShowPrimaryButton ? "auto" : "none"}
        accessibilityElementsHidden={!shouldShowPrimaryButton}
        importantForAccessibility={shouldShowPrimaryButton ? "auto" : "no-hide-descendants"}
      >
        {slides.map((slide, slideIndex) => (
          <CarouselPrimaryButton
            key={slideIndex}
            slide={slide}
            slideIndex={slideIndex}
            onPress={onPrimaryPress}
          />
        ))}
      </Animated.View>
    </Box>
  );
}

type CarouselPrimaryButtonProps = Readonly<{
  slide: GenericAwarenessModalCarouselSlide;
  slideIndex: number;
  onPress: (slide: GenericAwarenessModalCarouselSlide) => void;
}>;

function CarouselPrimaryButton({ slide, slideIndex, onPress }: CarouselPrimaryButtonProps) {
  const { currentIndex, scrollProgressSharedValue } = useSlidesContext();
  const isCurrentSlide = currentIndex === slideIndex;
  const primaryButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollProgressSharedValue.value,
        [slideIndex - 1, slideIndex, slideIndex + 1],
        [0, 1, 0],
        "clamp",
      ),
    };
  }, [scrollProgressSharedValue, slideIndex]);

  if (!hasPrimaryButton(slide)) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.primaryButton, primaryButtonAnimatedStyle]}
      pointerEvents={isCurrentSlide ? "auto" : "none"}
      accessibilityElementsHidden={!isCurrentSlide}
      importantForAccessibility={isCurrentSlide ? "auto" : "no-hide-descendants"}
    >
      <Button appearance="gray" size="lg" onPress={() => onPress(slide)}>
        {slide.primaryButtonLabel}
      </Button>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
  primaryButtonMeasurer: {
    opacity: 0,
    position: "absolute",
    left: 0,
    right: 0,
  },
});
