import React, { memo, useRef, useEffect, useMemo, ReactElement } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { BorderProps } from "styled-system";

type Props = BaseStyledProps &
  BorderProps & {
    style?: StyleProp<ViewStyle>;
    loading: boolean;
    children?: ReactElement;
    animated?: boolean;
  };

const StyledView = styled(Animated.View)``;

const Skeleton: React.FC<Props> = ({
  style,
  loading,
  children = null,
  animated = true,
  ...props
}) => {
  const { colors } = useTheme();
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      const duration = 1000;
      const values = { min: 0.5, max: 1 };

      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: values.min,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: values.max,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useMemo(
    () => [
      {
        backgroundColor: colors.skeletonBg,
      },
      style,
      {
        opacity: opacityAnim,
      },
    ],
    [style, colors.skeletonBg, opacityAnim],
  );

  return loading ? <StyledView style={animatedStyle} {...props} /> : children;
};

export default memo(Skeleton);
