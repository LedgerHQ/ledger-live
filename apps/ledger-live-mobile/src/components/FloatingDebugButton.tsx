import React, { useRef } from "react";
import {
  StyleSheet,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import { Flex } from "@ledgerhq/native-ui";

type Props = {
  onPress: () => void;
  onLongPress: () => void | undefined;
  Icon: IconType;
};

const boxSize = 30;

const FloatingDebugButton: React.FC<Props> = ({
  onPress,
  onLongPress,
  Icon,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const { height, width } = useWindowDimensions();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        Math.abs(gestureState.dx) > 5,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    }),
  ).current;

  const { top, left, right, bottom } = useSafeAreaInsets();

  return (
    <Animated.View
      style={[
        {
          transform: [
            {
              translateX: pan.x.interpolate({
                inputRange: [left, width - right - boxSize],
                outputRange: [left, width - right - boxSize],
                extrapolate: "clamp",
              }),
            },
            {
              translateY: pan.y.interpolate({
                inputRange: [top, height - bottom - boxSize],
                outputRange: [top, height - bottom - boxSize],
                extrapolate: "clamp",
              }),
            },
          ],
        },
        styles.wrap,
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress}>
        <Flex
          height={boxSize}
          width={boxSize}
          borderRadius={12}
          bg="black"
          alignItems="center"
          justifyContent="center"
        >
          {Icon ? <Icon size={(2 * boxSize) / 3} color="white" /> : null}
        </Flex>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    zIndex: 999,
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
  },
});

export default FloatingDebugButton;
