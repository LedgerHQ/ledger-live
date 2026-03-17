import { useSharedValue, useAnimatedScrollHandler } from "react-native-reanimated";

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
