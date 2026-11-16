import { type ReactNode, useCallback, useState } from "react";
import {
  Animated,
  type GestureResponderHandlers,
  type LayoutChangeEvent,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MockServerStatus } from "../../../../useMockServerStatus";
import type { MockServerOverlayDevice } from "../../types";
import { BAR_BUTTON_SIZE, getBarButtonsWidth } from "./MockServerBarButtons";
import { useDraggablePosition } from "./useDraggablePosition";
import { useResizeGesture } from "./useResizeGesture";
import { clamp } from "./utils";

export const DEVICE_SCREEN_GAP = 8;
const MIN_DEVICE_SCREEN_WIDTH = 120;

export type MockServerFloatingBarProps = {
  status: MockServerStatus;
  colorScheme: "light" | "dark";
  devices: readonly MockServerOverlayDevice[];
  zIndex: number;
  selectedDeviceId: string | null;
  onPressMain: () => void;
  onPressDevice: (deviceId: string) => void;
  /** Shown under the bar, or above it when there is no room below, and dragged with it. */
  deviceScreen: ReactNode;
  deviceScreenWidth: number;
  onResizeDeviceScreen: (width: number) => void;
};

export type MockServerFloatingBarViewModel = Omit<
  MockServerFloatingBarProps,
  "deviceScreenWidth" | "onResizeDeviceScreen"
> & {
  translateX: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number> | Animated.AnimatedAddition<number>;
  dragHandlers: GestureResponderHandlers;
  hasDeviceScreen: boolean;
  isDeviceScreenAbove: boolean;
  /** The stored width, or the live one while the device screen is resized. */
  shownDeviceScreenWidth: number;
  isResizing: boolean;
  resizeHandlers: GestureResponderHandlers;
  onDeviceScreenLayout: (event: LayoutChangeEvent) => void;
};

export function useMockServerFloatingBarViewModel({
  deviceScreenWidth,
  onResizeDeviceScreen,
  ...props
}: MockServerFloatingBarProps): MockServerFloatingBarViewModel {
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hasDeviceScreen = props.deviceScreen !== null;
  const maxDeviceScreenWidth = screen.width - insets.left - insets.right;
  const storedDeviceScreenWidth = clamp(
    deviceScreenWidth,
    MIN_DEVICE_SCREEN_WIDTH,
    maxDeviceScreenWidth,
  );

  const resizeGesture = useResizeGesture({
    width: storedDeviceScreenWidth,
    minWidth: MIN_DEVICE_SCREEN_WIDTH,
    maxWidth: maxDeviceScreenWidth,
    onResizeEnd: onResizeDeviceScreen,
  });
  const isResizing = resizeGesture.liveWidth !== null;
  const shownDeviceScreenWidth = resizeGesture.liveWidth ?? storedDeviceScreenWidth;

  const buttonsWidth = getBarButtonsWidth(props.devices.length);
  const drag = useDraggablePosition({
    width: hasDeviceScreen ? Math.max(buttonsWidth, shownDeviceScreenWidth) : buttonsWidth,
    height: BAR_BUTTON_SIZE,
    initialTopOffset: 2 * BAR_BUTTON_SIZE,
  });

  const [deviceScreenHeight, setDeviceScreenHeight] = useState(0);
  const deviceScreenOffset = deviceScreenHeight + DEVICE_SCREEN_GAP;
  const fitsBelow = drag.y + deviceScreenOffset <= drag.maxY;

  const [isAboveDuringResize, setIsAboveDuringResize] = useState<boolean | null>(null);
  if (isResizing && isAboveDuringResize === null) setIsAboveDuringResize(!fitsBelow);
  if (!isResizing && isAboveDuringResize !== null) setIsAboveDuringResize(null);
  const isDeviceScreenAbove = hasDeviceScreen && (isAboveDuringResize ?? !fitsBelow);

  const onDeviceScreenLayout = useCallback(
    (event: LayoutChangeEvent) => setDeviceScreenHeight(event.nativeEvent.layout.height),
    [],
  );

  return {
    ...props,
    translateX: drag.translateX,
    translateY: isDeviceScreenAbove
      ? Animated.add<number>(drag.translateY, -deviceScreenOffset)
      : drag.translateY,
    dragHandlers: drag.panHandlers,
    hasDeviceScreen,
    isDeviceScreenAbove,
    shownDeviceScreenWidth,
    isResizing,
    resizeHandlers: resizeGesture.panHandlers,
    onDeviceScreenLayout,
  };
}
