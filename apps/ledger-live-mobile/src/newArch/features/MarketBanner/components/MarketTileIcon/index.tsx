import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";

const ICON_SIZE = 32;

interface MarketTileIconProps {
  imageUrl?: string | null;
  name: string;
}

const MarketTileIcon = ({ imageUrl, name }: MarketTileIconProps) => {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Use market image URL, fallback to letter if no image or error
  if (imageUrl && !imageError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.icon}
        resizeMode="cover"
        onError={() => setImageError(true)}
        testID="market-tile-icon-image"
      />
    );
  }

  // Fallback: show first letter in a circle
  return (
    <View
      style={[styles.letterFallback, { backgroundColor: colors.opacityDefault.c10 }]}
      testID="market-tile-icon-fallback"
    >
      <Text variant="small" fontWeight="semiBold" color="neutral.c100">
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
  },
  letterFallback: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default React.memo(MarketTileIcon);
