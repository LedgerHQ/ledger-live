import React, { memo, useMemo } from "react";
import { Animated, ImageBackground, View } from "react-native";
import { useTheme, useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

const FADE_DISTANCE = 150;

type Props = {
  scrollY?: Animated.Value;
  fadeDistance?: number;
};

function EarnBackgroundComponent({ scrollY, fadeDistance }: Props) {
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
        aspectRatio: 25 / 32,
      },
    }),
    [],
  );

  const isDark = useMemo(() => {
    return colorScheme === "dark";
  }, [colorScheme]);

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

  const source = require("~/images/liveApps/earn/background-dark.webp");

  return (
    <View style={styles.container} pointerEvents="none">
      {isDark && (
        <Animated.View style={{ opacity }}>
          <ImageBackground source={source} style={styles.imageContainer} />
        </Animated.View>
      )}
    </View>
  );
}

export const EarnBackground = memo(EarnBackgroundComponent);
