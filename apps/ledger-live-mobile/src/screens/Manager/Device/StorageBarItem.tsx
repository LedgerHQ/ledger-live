import { Box } from "@ledgerhq/native-ui";
import React from "react";
import { useTheme } from "styled-components/native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";

const StorageBarItem = (props: FlexBoxProps & { installing: boolean }) => {
  const { colors } = useTheme();
  const { installing, backgroundColor, ...rest } = props;

  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const opacityValue = interpolate(opacity.value, [0, 1], [0, 1]);
    return {
      opacity: withRepeat(
        withTiming(opacityValue, { duration: 800 }),
        -1,
        true,
      ),
    };
  });

  opacity.value = withTiming(1, { duration: 800 });

  return (
    <Box backgroundColor={installing ? undefined : backgroundColor} {...rest}>
      {props.installing ? (
        <Animated.View
          style={[
            animatedStyle,
            {
              height: "100%",
              width: "100%",
              backgroundColor: colors.neutral.c30,
            },
          ]}
        />
      ) : null}
    </Box>
  );
};

export default StorageBarItem;
