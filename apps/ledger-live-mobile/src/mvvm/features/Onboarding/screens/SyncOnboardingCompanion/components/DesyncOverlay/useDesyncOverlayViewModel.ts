import { useTheme } from "styled-components/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDisplayWithDelay } from "./useDisplayWithDelay";
import type { DesyncOverlayProps, DesyncOverlayViewProps } from "./types";

export const useDesyncOverlayViewModel = ({
  isOpen,
  delay,
  productName,
}: DesyncOverlayProps): DesyncOverlayViewProps => {
  const shouldDisplay = useDisplayWithDelay({ isOpen, delay });
  const { radii } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return {
    shouldDisplay,
    productName,
    borderRadius: radii[2],
    bottomInset: bottom,
  };
};
