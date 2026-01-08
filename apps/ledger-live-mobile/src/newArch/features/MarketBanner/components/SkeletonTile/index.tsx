import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { SkeletonTileProps } from "../../types";

const SKELETON_TILE_WIDTH = 96;
const SKELETON_TILE_HEIGHT = 110;
const ANIMATION_DURATION = 800;
const STAGGER_DELAY = 100;

const SkeletonTile = ({ index }: SkeletonTileProps) => {
  const { colors } = useTheme();
  const skeletonColor = colors.opacityDefault.c10;

  const opacity = useSharedValue(0.4);

  useEffect(() => {
    const delay = index * STAGGER_DELAY;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: ANIMATION_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
  }, [opacity, index]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.opacityDefault.c05 }]}
      testID={`market-banner-skeleton-${index}`}
    >
      <Flex alignItems="center" justifyContent="center" flex={1} rowGap={8}>
        <Animated.View
          style={[styles.iconSkeleton, { backgroundColor: skeletonColor }, animatedStyle]}
        />
        <Animated.View
          style={[styles.nameSkeleton, { backgroundColor: skeletonColor }, animatedStyle]}
        />
        <Animated.View
          style={[styles.changeSkeleton, { backgroundColor: skeletonColor }, animatedStyle]}
        />
      </Flex>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SKELETON_TILE_WIDTH,
    height: SKELETON_TILE_HEIGHT,
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
  },
  iconSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  nameSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 4,
  },
  changeSkeleton: {
    width: 48,
    height: 14,
    borderRadius: 4,
  },
});

export default React.memo(SkeletonTile);
