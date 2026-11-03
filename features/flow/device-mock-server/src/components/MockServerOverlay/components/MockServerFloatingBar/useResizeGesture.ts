import { useState } from "react";
import { PanResponder } from "react-native";
import { clamp, useLatest } from "./utils";

type Options = {
  width: number;
  minWidth: number;
  maxWidth: number;
  onResizeEnd: (width: number) => void;
};

export function useResizeGesture({ width, minWidth, maxWidth, onResizeEnd }: Options) {
  const latest = useLatest({ width, minWidth, maxWidth, onResizeEnd });
  const [liveWidth, setLiveWidth] = useState<number | null>(null);

  const [panResponder] = useState(() => {
    let startWidth = 0;
    let lastWidth = 0;
    const finish = () => {
      latest.current.onResizeEnd(lastWidth);
      setLiveWidth(null);
    };
    return PanResponder.create({
      // Captured so the handle's content cannot take the touch first
      onStartShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startWidth = latest.current.width;
        lastWidth = startWidth;
        setLiveWidth(startWidth);
      },
      onPanResponderMove: (_event, gesture) => {
        const { minWidth: min, maxWidth: max } = latest.current;
        lastWidth = clamp(startWidth + gesture.dx, min, max);
        setLiveWidth(lastWidth);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  });

  return { panHandlers: panResponder.panHandlers, liveWidth };
}
