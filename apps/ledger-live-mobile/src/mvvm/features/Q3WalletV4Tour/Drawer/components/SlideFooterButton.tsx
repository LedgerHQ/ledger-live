import React from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useSlideFooterButtonViewModel } from "../hooks/useSlideFooterButtonViewModel";

interface SlideFooterButtonProps {
  readonly onComplete: () => void;
}

export const SlideFooterButton = ({ onComplete }: SlideFooterButtonProps) => {
  const {
    primaryLabel,
    doneLabel,
    continueStyle,
    doneStyle,
    isLastSlide,
    isDoneButtonInteractive,
    goNext,
    complete,
  } = useSlideFooterButtonViewModel(onComplete);

  return (
    <Animated.View style={styles.container}>
      <Animated.View style={continueStyle} pointerEvents={isLastSlide ? "none" : "box-none"}>
        <Button appearance="base" size="lg" onPress={goNext}>
          {primaryLabel}
        </Button>
      </Animated.View>

      <Animated.View
        style={[styles.overlay, doneStyle]}
        pointerEvents={isDoneButtonInteractive ? "box-none" : "none"}
      >
        <Button appearance="base" size="lg" onPress={complete}>
          {doneLabel}
        </Button>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
