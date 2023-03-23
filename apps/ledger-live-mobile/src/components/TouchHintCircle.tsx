import React, { useCallback, useEffect, useMemo } from "react";
import { Animated, Easing } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";

type Props = FlexBoxProps & {
  stopAnimation: boolean;
};

const TouchHintCircle = ({ stopAnimation, ...props }: Props) => {
  const leftAnimated = useMemo(() => new Animated.Value(0), []);
  const opacityAnimated = useMemo(() => new Animated.Value(0), []);
  const growAnimated = useMemo(() => new Animated.Value(0), []);

  const startAnimation = useCallback(() => {
    const animation = Animated.sequence([
      Animated.timing(opacityAnimated, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(growAnimated, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(leftAnimated, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(opacityAnimated, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    animation.start(() => {
      if (!stopAnimation) {
        growAnimated.setValue(0);
        leftAnimated.setValue(0);
        startAnimation();
      }
    });
  }, [stopAnimation, leftAnimated, opacityAnimated, growAnimated]);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  const translateX = leftAnimated.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  const opacity = opacityAnimated.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scale = growAnimated.interpolate({
    inputRange: [0, 1],
    outputRange: [1.2, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX }, { scaleX: scale }, { scaleY: scale }],
          opacity,
        },
      ]}
    >
      <Flex
        alignItems="center"
        justifyContent="center"
        opacity={0.7}
        height="100%"
        {...props}
      >
        <Flex
          height={40}
          width={40}
          borderRadius={40}
          alignItems="center"
          justifyContent="center"
          backgroundColor="primary.c70"
        >
          <Flex
            height={20}
            width={20}
            borderRadius={20}
            backgroundColor="primary.c40"
          />
        </Flex>
      </Flex>
    </Animated.View>
  );
};

export default TouchHintCircle;
