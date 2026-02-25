import React, { FC, useEffect, useState } from "react";
import { View, StyleSheet, ViewStyle, Animated } from "react-native";
import { useTheme } from "styled-components/native";

interface OwnProps {
  width?: number;
  minHeight?: number;
  barHeight?: number;
  mt?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
  show?: boolean;
}

type Props = OwnProps;
const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  skeleton: {
    width: "100%",
    borderRadius: 8,
    marginVertical: 6,
    minHeight: 20,
    minWidth: 60,
    overflow: "hidden",
    position: "relative",
  },
});
const SkeletonComponent: FC<Props> = ({
  width,
  barHeight,
  minHeight,
  mt,
  style,
  children,
  show,
}) => {
  const isSkeletonVisible: boolean = show !== undefined ? show : !children;
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isSkeletonVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [isSkeletonVisible, pulseAnim]);

  const skeletonStyle: ViewStyle = {
    width: width ?? "100%",
    height: barHeight ?? minHeight ?? 20,
    minWidth: 60,
    minHeight: 16,
    borderRadius: 8,
    marginTop: mt,
    ...style,
  };
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      {isSkeletonVisible ? (
        <Animated.View
          style={[
            styles.skeleton,
            skeletonStyle,
            { opacity: pulseAnim },
            { backgroundColor: colors.opacityDefault.c05 },
          ]}
        />
      ) : (
        children || null
      )}
    </View>
  );
};

export const Skeleton = SkeletonComponent;
