import { CSSProperties } from "react";
import { ImageStyle, TextStyle, ViewStyle } from "react-native";
import Animated, {
  AnimateProps,
  AnimateStyle,
  AnimatedStyleProp,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "styled-components/native";

type BulletType = "active" | "nearby" | "far" | "none";

const useBulletStyles = () => {
  const { colors } = useTheme();

  const BulletStyle: { [key in BulletType]: any } = {
    active: {
      width: 16,
      height: 6,
      backgroundColor: colors.opacityDefault.c80,
      borderRadius: 1000,
    },
    nearby: {
      width: 8,
      height: 6,
      backgroundColor: colors.opacityDefault.c30,
      borderRadius: 1000,
    },
    far: {
      width: 4,
      height: 6,
      backgroundColor: colors.opacityDefault.c10,
      borderRadius: 1000,
    },
    none: {
      width: 0,
      height: 0,
    },
  };

  return BulletStyle;
};

const Bullet = ({ type }: { type: BulletType }) => {
  const bulletStyles = useBulletStyles();

  const animatedStyles = useAnimatedStyle(
    () => ({
      width: withSpring(bulletStyles[type].width),
      backgroundColor: withSpring(bulletStyles[type].backgroundColor),
    }),
    [type],
  );

  return <Animated.View style={[{ ...bulletStyles[type] }, animatedStyles]} />;
};

export default Bullet;
