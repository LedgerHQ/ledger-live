import React, { useDeferredValue } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import Animated from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { useSlideScrollAnimations } from "LLM/components/Slides";
import { WalletV4TourSlide } from "../types";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

type SlideItemProps = WalletV4TourSlide & { index: number };

export function SlideItem({ title, description, index, lottieSrc, speed }: SlideItemProps) {
  const { currentIndex } = useSlidesContext();
  const { animatedStyle, textAnimatedStyle, handleLayout } = useSlideScrollAnimations(index);
  const styles = useStyleSheet(
    () => ({
      lottie: {
        width: "100%",
        height: "100%",
      },
    }),
    [],
  );

  // for some reason, iOS needs a deferred value. Otherwise, 3rd animation already starts and then starts again from the beginning.
  const deferredCurrentIndex = useDeferredValue(currentIndex);
  const isActive = deferredCurrentIndex === index;

  const shouldRender = Math.abs(deferredCurrentIndex - index) <= 1;

  // LottieView actually can resolve a number that is an assetId.
  const source = lottieSrc as unknown as string;

  return (
    <Animated.View onLayout={handleLayout} style={[animatedStyle, { flex: 1 }]}>
      <Box
        lx={{
          flex: 1,
        }}
      >
        {shouldRender && isActive ? (
          <LottieView
            key={`${lottieSrc}-${index}-animation`}
            autoPlay
            loop={false}
            style={styles.lottie}
            source={source}
            speed={speed}
          />
        ) : (
          <LottieView
            key={`${lottieSrc}-${index}-placeholder`}
            autoPlay={false}
            loop={false}
            style={styles.lottie}
            source={source}
          />
        )}
      </Box>

      <Animated.View style={textAnimatedStyle} pointerEvents="none">
        <Box
          lx={{
            justifyContent: "center",
            minHeight: "s80", // the height of 2 lines of text
          }}
        >
          <Text
            typography="heading2SemiBold"
            lx={{
              textAlign: "center",
              color: "base",
              marginBottom: "s8",
            }}
            numberOfLines={2}
          >
            {title}
          </Text>
        </Box>

        <Text
          typography="body2"
          lx={{
            color: "muted",
            textAlign: "center",
          }}
          numberOfLines={2}
        >
          {description}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
