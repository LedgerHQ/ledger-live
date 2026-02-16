import React, { memo, useMemo } from "react";
import { View, ImageBackground } from "react-native";
import { useTheme, useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

function EarnBackgroundComponent() {
  const { colorScheme } = useTheme();
  const styles = useStyleSheet(
    theme => ({
      container: {
        position: "absolute",
        top: theme.sizes.s0,
        left: theme.sizes.s0,
        right: theme.sizes.s0,
        bottom: theme.sizes.s0,
      },
      imageContainer: {
        width: theme.sizes.full,
        height: theme.sizes.full,
      },
    }),
    [],
  );

  const chosenSource = useMemo(() => {
    return colorScheme === "dark"
      ? require("~/images/liveApps/earn/background-dark.webp")
      : require("~/images/liveApps/earn/background-light.webp");
  }, [colorScheme]);

  return (
    <View style={styles.container} pointerEvents="none">
      <ImageBackground source={chosenSource} style={styles.imageContainer} />
    </View>
  );
}

export const EarnBackground = memo(EarnBackgroundComponent);
