import React, { memo, useMemo } from "react";
import { ImageBackground, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useTheme, useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import swapBackgroundDark from "~/images/liveApps/swap/MOBILE_SWAP_LW_V4_BG.webp";
import earnBackgroundDark from "~/images/liveApps/earn/background-dark.webp";
import cardBackgroundDark from "~/images/card/card-bg.webp";
import portfolioBackgroundDark from "~/images/portfolio/v4-dark.webp";
import wallet40BackgroundLight from "~/images/portfolio/v4-light.webp";

export { useScrollOffset } from "./useScrollOffset";

// Matches the Wallet 4.0 tab header height.
const FADE_DISTANCE = 48;

const darkBackgrounds = {
  portfolio: portfolioBackgroundDark,
  swap: swapBackgroundDark,
  earn: earnBackgroundDark,
  pay: cardBackgroundDark,
} as const;

type Wallet40BackgroundType = keyof typeof darkBackgrounds;

type Props = {
  type: Wallet40BackgroundType;
  scrollY?: SharedValue<number>;
  fadeDistance?: number;
};

function Wallet40BackgroundComponent({ type, scrollY, fadeDistance }: Props) {
  const { colorScheme } = useTheme();
  const styles = useStyleSheet(
    theme => ({
      container: {
        position: "absolute",
        top: theme.sizes.s0,
        left: theme.sizes.s0,
        right: theme.sizes.s0,
        bottom: theme.sizes.s0,
        backgroundColor: theme.colors.bg.base,
      },
      imageContainer: {
        width: "100%",
        aspectRatio: 1,
      },
    }),
    [],
  );

  const distance = fadeDistance ?? FADE_DISTANCE;
  const fadeStyle = useAnimatedStyle(
    () => ({
      opacity: scrollY ? interpolate(scrollY.value, [0, distance], [1, 0], Extrapolation.CLAMP) : 1,
    }),
    [scrollY, distance],
  );

  const source = useMemo(() => {
    if (colorScheme === "dark") {
      return darkBackgrounds[type];
    }
    return wallet40BackgroundLight;
  }, [colorScheme, type]);

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={fadeStyle}>
        <ImageBackground source={source} style={styles.imageContainer} />
      </Animated.View>
    </View>
  );
}

export const Wallet40Background = memo(Wallet40BackgroundComponent);
