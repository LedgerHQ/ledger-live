// @flow
import React, { memo, useState, useCallback } from "react";
import { Image, View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

import LText from "../../components/LText";

type Props = {
  name?: string,
  icon?: string | null,
  size?: number,
  isDisabled?: boolean,
};

function AppIcon({ size = 48, name, icon, isDisabled }: Props) {
  const { colors } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const handleImageLoad = useCallback(() => setImageLoaded(true), []);

  const firstLetter =
    typeof name === "string" && name[0] ? name[0].toUpperCase() : "";

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderColor: colors.fog,
          backgroundColor: colors.card,
        },
      ]}
    >
      {!imageLoaded && firstLetter ? (
        <LText semiBold style={{ fontSize: size / 2 }}>
          {firstLetter}
        </LText>
      ) : null}
      {icon &&
        (isDisabled ? (
          <>
            <Image
              source={{ uri: icon }}
              style={[
                styles.image,
                styles.disabledTopLayer,
                { width: size, height: size },
              ]}
              fadeDuration={200}
              onLoad={handleImageLoad}
            />
            <Image
              source={{ uri: icon }}
              style={[
                styles.image,
                styles.disabledBottomLayer,
                { width: size, height: size, tintColor: colors.fog },
              ]}
              fadeDuration={200}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          <Image
            source={{ uri: icon }}
            style={[styles.image, { width: size, height: size }]}
            fadeDuration={200}
            onLoad={handleImageLoad}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    position: "relative",
  },
  image: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 8,
    overflow: "hidden",
  },
  disabledTopLayer: {
    position: "absolute",
    opacity: 0.3,
    zIndex: 1,
  },
  disabledBottomLayer: {
    position: "absolute",
    zIndex: 0,
  },
});

export default memo<Props>(AppIcon);
