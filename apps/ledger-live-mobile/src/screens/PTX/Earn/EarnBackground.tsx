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
        width: "100%",
        height: 500,
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
      return require("~/images/liveApps/earn/background-dark.webp");
    }
    return require("~/images/portfolio/v4-light.webp");
  }, [colorScheme]);

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={{ opacity }}>
        <ImageBackground source={source} style={styles.imageContainer} />
      </Animated.View>
    </View>
  );
}

export const EarnBackground = memo(EarnBackgroundComponent);
