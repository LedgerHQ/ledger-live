import React, { memo, useMemo } from "react";
import { Animated, ImageBackground, View } from "react-native";
import { useTheme, useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import swapBackgroundDark from "~/images/liveApps/swap/MOBILE_SWAP_LW_V4_BG.webp";
import earnBackgroundDark from "~/images/liveApps/earn/background-dark.webp";
import wallet40BackgroundLight from "~/images/portfolio/v4-light.webp";

const FADE_DISTANCE = 150;

const darkBackgrounds = {
  swap: swapBackgroundDark,
  earn: earnBackgroundDark,
} as const;

type LiveAppBackgroundType = keyof typeof darkBackgrounds;

type Props = {
  type: LiveAppBackgroundType;
  scrollY?: Animated.Value;
  fadeDistance?: number;
};

function LiveAppBackgroundComponent({ type, scrollY, fadeDistance }: Props) {
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

  const opacity = useMemo(
    () =>
      scrollY
        ? scrollY.interpolate({
            inputRange: [0, fadeDistance ?? FADE_DISTANCE],
            outputRange: [1, 0],
            extrapolate: "clamp",
          })
        : 1,
    [scrollY, fadeDistance],
  );

  const source = useMemo(() => {
    if (colorScheme === "dark") {
      return darkBackgrounds[type];
    }
    return wallet40BackgroundLight;
  }, [colorScheme, type]);

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={{ opacity }}>
        <ImageBackground source={source} style={styles.imageContainer} />
      </Animated.View>
    </View>
  );
}

export const LiveAppBackground = memo(LiveAppBackgroundComponent);
