import React, { memo, useMemo, useState } from "react";
import { Animated, ImageBackground } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

function EarnBackgroundComponent() {
  const { colorScheme } = useTheme();
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const chosenSource = useMemo(() => {
    return colorScheme === "dark"
      ? require("~/images/liveApps/earn/background-dark.webp")
      : require("~/images/liveApps/earn/background-light.webp");
  }, [colorScheme]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
      }}
      pointerEvents="none"
    >
      <AnimatedImageBackground
        source={chosenSource}
        style={{ width: "100%", height: "100%" }}
        onLoad={() => setImageLoaded(true)}
        onLoadStart={() => setImageLoaded(false)}
        fadeDuration={imageLoaded ? 0 : 300}
      />
    </Animated.View>
  );
}

export const EarnBackground = memo(EarnBackgroundComponent);
