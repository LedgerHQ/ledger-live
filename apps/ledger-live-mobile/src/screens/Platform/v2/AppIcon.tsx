import React, { memo, useState, useCallback } from "react";
import { Image, View, StyleSheet } from "react-native";
import { DefaultTheme, useTheme } from "styled-components/native";
import { Theme } from "../../../colors";
import LText from "~/components/LText";

type Props = {
  name?: string | null;
  icon?: string | null;
  size?: number;
  isDisabled?: boolean;
};

export const AppIcon = memo(({ size = 48, name, icon, isDisabled }: Props) => {
  const { colors } = useTheme() as DefaultTheme & Theme;
  const [imageLoaded, setImageLoaded] = useState(true);
  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageLoaded(false), []);
  const firstLetter = typeof name === "string" && name[0] ? name[0].toUpperCase() : "";
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderColor: colors.neutral.c30,
          backgroundColor: "transparent",
        },
      ]}
    >
      {!imageLoaded && firstLetter ? (
        <LText
          semiBold
          variant="h2"
          style={{
            lineHeight: size,
          }}
        >
          {firstLetter}
        </LText>
      ) : icon ? (
        <>
          <Image
            source={{
              uri: icon,
            }}
            style={[
              styles.image,
              ...(isDisabled ? [styles.disabledTopLayer] : []),
              {
                width: size,
                height: size,
              },
            ]}
            fadeDuration={200}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {isDisabled ? (
            <Image
              source={{
                uri: icon,
              }}
              style={[
                styles.image,
                styles.disabledBottomLayer,
                {
                  width: size,
                  height: size,
                  tintColor: colors.fog,
                },
              ]}
              fadeDuration={200}
            />
          ) : null}
        </>
      ) : (
        <LText
          semiBold
          variant="h2"
          style={{
            lineHeight: size,
          }}
        >
          {firstLetter}
        </LText>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    position: "relative",
  },
  image: {
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
