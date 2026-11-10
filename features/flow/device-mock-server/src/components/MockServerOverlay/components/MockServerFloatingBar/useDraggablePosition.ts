import { useState } from "react";
import { Animated, PanResponder, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clamp, useLatest } from "./utils";

const DRAG_THRESHOLD = 5;

type Options = {
  width: number;
  height: number;
  initialTopOffset: number;
};

export function useDraggablePosition({ width, height, initialTopOffset }: Options) {
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bounds = {
    minX: insets.left,
    maxX: Math.max(insets.left, screen.width - insets.right - width),
    minY: insets.top,
    maxY: screen.height - insets.bottom - height,
  };
  const latestBounds = useLatest(bounds);
  const initialY = insets.top + initialTopOffset;
  const [pan] = useState(() => new Animated.ValueXY({ x: screen.width, y: initialY }));
  const [settledY, setSettledY] = useState(initialY);

  const [panResponder] = useState(() => {
    const clampToBounds = () =>
      pan.stopAnimation(({ x, y }) => {
        const { minX, maxX, minY, maxY } = latestBounds.current;
        const clamped = { x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) };
        pan.setValue(clamped);
        setSettledY(clamped.y);
      });
    const settle = () => {
      pan.flattenOffset();
      clampToBounds();
    };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > DRAG_THRESHOLD || Math.abs(gesture.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: () => {
        clampToBounds();
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: settle,
      onPanResponderTerminate: settle,
    });
  });

  return {
    panHandlers: panResponder.panHandlers,
    translateX: pan.x.interpolate({
      inputRange: [bounds.minX, bounds.maxX + 1],
      outputRange: [bounds.minX, bounds.maxX + 1],
      extrapolate: "clamp",
    }),
    translateY: pan.y.interpolate({
      inputRange: [bounds.minY, bounds.maxY + 1],
      outputRange: [bounds.minY, bounds.maxY + 1],
      extrapolate: "clamp",
    }),
    y: clamp(settledY, bounds.minY, bounds.maxY),
    maxY: bounds.maxY,
  };
}
