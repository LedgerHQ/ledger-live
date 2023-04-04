import React, { useRef } from "react";
import {
  StyleSheet,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconOrElementType } from "@ledgerhq/native-ui/components/Icon/type";
import { Flex } from "@ledgerhq/native-ui";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";

type Props = {
  onPress: () => void;
  onLongPress?: () => void | undefined;
  Icon: IconOrElementType;
  iconContainerProps?: FlexBoxProps;
  boxWidth?: number;
  boxHeight?: number;
};

const FloatingDebugButton: React.FC<Props> = ({
  onPress,
  onLongPress,
  Icon,
  iconContainerProps,
  boxWidth = 30,
  boxHeight = 30,
}) => {
  const { height, width } = useWindowDimensions();
  const { top, left, right, bottom } = useSafeAreaInsets();
  const pan = useRef(
    new Animated.ValueXY({ x: 10000, y: top + 2 * boxHeight }),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        Math.abs(gestureState.dx) > 5,
      onPanResponderGrant(e, gestureState) {
        pan.setOffset({
          x: gestureState.x0 - boxWidth / 2,
          y: gestureState.y0 - boxHeight / 2,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
    }),
  ).current;

  return (
    <Animated.View
      style={[
        {
          transform: [
            {
              translateX: pan.x.interpolate({
                inputRange: [left, width - right - boxWidth],
                outputRange: [left, width - right - boxWidth],
                extrapolate: "clamp",
              }),
            },
            {
              translateY: pan.y.interpolate({
                inputRange: [top, height - bottom - boxHeight],
                outputRange: [top, height - bottom - boxHeight],
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
          height={boxHeight}
          width={boxWidth}
          borderRadius={12}
          bg="black"
          alignItems="center"
          justifyContent="center"
          {...iconContainerProps}
        >
          {React.isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon size={(2 * boxWidth) / 3} color="white" />
          )}
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
