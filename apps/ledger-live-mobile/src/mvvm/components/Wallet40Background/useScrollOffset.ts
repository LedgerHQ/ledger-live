import {
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

/**
 * Tracks a scrollable's vertical offset on the UI thread.
 * Pass `scrollY` to write into an existing shared value (e.g. one from a context).
 */
export function useScrollOffset(scrollY?: SharedValue<number>) {
  const ownScrollY = useSharedValue(0);
  const offset = scrollY ?? ownScrollY;
  const onScroll = useAnimatedScrollHandler(event => {
    offset.value = event.contentOffset.y;
  });
  return { scrollY: offset, onScroll };
}
