import React, { useEffect, useRef } from "react";
import { DotLottie } from "@lottiefiles/dotlottie-react-native";
import Lottie from "lottie-react-native";
import { type AnimationObject } from "lottie-react-native";
import Config from "react-native-config";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

export type LottieProps = Lottie["props"];
type AnimationSource = LottieProps["source"] | number;
type AnimationProps = Omit<LottieProps, "source"> & {
  source?: AnimationSource;
  style?: StyleProp<ViewStyle>;
};

// Type predicate function because AnimationObject is only defined as an interface
// and cannot be checked with `maybeAnimation instanceof AnimationObject` for ex.
function isAnimationObject(maybeAnimation: unknown): maybeAnimation is AnimationObject {
  return (
    (maybeAnimation as AnimationObject).w !== undefined &&
    (maybeAnimation as AnimationObject).h !== undefined
  );
}

function resolveDotLottieSource(source: AnimationSource): number | { uri: string } | null {
  if (!source || isAnimationObject(source)) return null;

  if (typeof source === "number") {
    return source;
  }

  if (typeof source === "string") {
    return source.toLowerCase().endsWith(".lottie") ? { uri: source } : null;
  }

  if (typeof source === "object" && "uri" in source) {
    const uri = typeof source.uri === "string" ? source.uri : "";
    return uri.toLowerCase().endsWith(".lottie") ? { uri } : null;
  }

  return null;
}

export default function Animation({ style, source, ...lottieProps }: AnimationProps) {
  if (!source) return null;

  const dotLottieSource = resolveDotLottieSource(source);
  const dotLottieRef = useRef<React.ElementRef<typeof DotLottie> | null>(null);
  const isJsonAnimation = isAnimationObject(source);

  // Computes the ratio w / h because lottie-react-native v6 seems not to compute and apply a ratio anymore.
  // It will be overridden if the provided style sets one (see below)
  let aspectRatio = 1;
  if (isJsonAnimation) {
    const { w, h } = source;

    if (w && h && h > 0) {
      aspectRatio = w / h;
    }
  }

  const resolvedStyle = isJsonAnimation ? [styles.default, { aspectRatio }, style] : style;

  useEffect(() => {
    if (!dotLottieSource || lottieProps.speed == null) return;
    dotLottieRef.current?.setSpeed?.(lottieProps.speed);
  }, [dotLottieSource, lottieProps.speed]);

  const handleDotLottieError = (error: unknown) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error("DotLottie failed to load", error);
    }
  };

  if (dotLottieSource) {
    return (
      <View>
        <DotLottie
          ref={dotLottieRef}
          source={dotLottieSource}
          style={StyleSheet.flatten(style)}
          loop={lottieProps.loop ?? true}
          autoplay={Config.DETOX ? false : lottieProps.autoPlay ?? true}
          onError={handleDotLottieError}
          onComplete={
            lottieProps.onAnimationFinish ? () => lottieProps.onAnimationFinish?.(false) : undefined
          }
        />
      </View>
    );
  }

  // The style prop order matters:
  // Animation prop `style` could define both a width and height, or an aspectRatio, and should override the computed aspectRatio
  return (
    <View>
      <Lottie
        {...lottieProps}
        source={source as LottieProps["source"]}
        style={resolvedStyle}
        loop={lottieProps.loop ?? true}
        autoPlay={Config.DETOX ? false : lottieProps.autoPlay ?? true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  default: {
    width: 300,
  },
});
