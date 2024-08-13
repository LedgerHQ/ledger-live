import React, { PropsWithChildren } from "react";
import { ColorValue, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
  AnimatedStyle,
} from "react-native-reanimated";

type Props = PropsWithChildren<{
  pt?: number;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  layoutY: SharedValue<number>;
  totalHeight: number;
  opacityHeight: number;
  animationHeight: number;
  backgroundColor?: ColorValue;
  opacityChildren?: React.ReactNode;
}>;

export default function AnimatedBar({
  pt = 0,
  style,
  layoutY,
  backgroundColor,
  totalHeight,
  opacityHeight,
  animationHeight,
  opacityChildren,
  children,
}: Props) {
  const heightStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    const headerHeight = interpolate(
      layoutY.value,
      [0, animationHeight],
      [totalHeight, totalHeight - animationHeight],
      Extrapolation.CLAMP,
    );

    return {
      backgroundColor: backgroundColor,
      paddingTop: pt,
      height: headerHeight + pt,
    };
  });

  const transformStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    return {
      // Height necessary for proper transform
      height: totalHeight,
      transform: [
        {
          translateY: interpolate(
            layoutY.value,
            [0, animationHeight],
            [0, -animationHeight],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const opacityStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    return {
      height: opacityHeight,
      opacity: interpolate(layoutY.value, [0, animationHeight], [1, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={[style, heightStyle]}>
      <Animated.View style={transformStyle}>
        <Animated.View style={opacityStyle}>{opacityChildren}</Animated.View>
        {children}
      </Animated.View>
    </Animated.View>
  );
}
