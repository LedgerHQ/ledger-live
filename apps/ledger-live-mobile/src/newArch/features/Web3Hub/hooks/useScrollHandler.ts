import { useCallback, useRef } from "react";
import { useSharedValue, useAnimatedScrollHandler } from "react-native-reanimated";
import { WebviewProps } from "~/components/Web3AppWebview/types";

const clamp = (value: number, lowerBound: number, upperBound: number) => {
  "worklet";
  return Math.min(Math.max(lowerBound, value), upperBound);
};

export default function useScrollHandler(clampUpperBound: number) {
  const layoutY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler<{ prevY: number; prevLayoutY: number }>({
    onScroll: (event, ctx) => {
      if (!layoutY || ctx.prevLayoutY === undefined || ctx.prevY === undefined) return;

      const diff = event.contentOffset.y - ctx.prevY;

      layoutY.value = clamp(ctx.prevLayoutY + diff, 0, clampUpperBound);
    },
    onBeginDrag: (event, ctx) => {
      if (layoutY) {
        ctx.prevLayoutY = layoutY.value;
      }
      // Avoid negative values to start with
      // if you beginDrag after a bounce drag
      ctx.prevY = Math.max(event.contentOffset.y, 0);
    },
  });

  return {
    layoutY,
    scrollHandler,
  };
}

type NoOptionals<T> = {
  [K in keyof T]-?: T[K];
};

const initialTimeoutRef = {
  prevY: 0,
  prevLayoutY: 0,
};

export function useWebviewScrollHandler(clampUpperBound: number) {
  const layoutY = useSharedValue(0);

  // Trick until we can properly use reanimated with the webview
  const timeoutRef = useRef<{ timeout?: NodeJS.Timeout; prevY: number; prevLayoutY: number }>(
    initialTimeoutRef,
  );

  const onScroll = useCallback(
    (event: Parameters<NoOptionals<WebviewProps>["onScroll"]>[0]) => {
      if (!layoutY) return;
      clearTimeout(timeoutRef.current.timeout);

      const currentY = event.nativeEvent.contentOffset.y;

      const diff = currentY - timeoutRef.current.prevY;
      layoutY.value = clamp(timeoutRef.current.prevLayoutY + diff, 0, clampUpperBound);

      timeoutRef.current.timeout = setTimeout(() => {
        timeoutRef.current.prevY = Math.max(currentY, 0);
        timeoutRef.current.prevLayoutY = layoutY.value;
      }, 100);
    },
    [clampUpperBound, layoutY],
  );

  return {
    layoutY,
    onScroll,
  };
}
