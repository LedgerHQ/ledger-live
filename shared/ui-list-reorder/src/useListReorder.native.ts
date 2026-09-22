import { useCallback, useEffect, useRef, useState } from "react";
import type { AccessibilityActionEvent, AccessibilityActionInfo } from "react-native";
import { Gesture, type PanGesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { reorderByIndex } from "./reorderByIndex";
import type { ListReorderOptions, ListReorderState } from "./types";

// Lumen's ListItem at default ("expanded") density is `t.sizes.s64` — 64px — not 48. Every
// step/shift calc here has to match the row's actual rendered height or the projected drop index
// (and the residual left over after committing it) comes out wrong.
const ROW_HEIGHT = 64;
const LONG_PRESS_ACTIVATION_MS = 350;
const NO_ACTIVE_INDEX = -1;
const SETTLE_TIMING = { duration: 120 };

const accessibilityActions: readonly AccessibilityActionInfo[] = [
  { name: "decrement", label: "Move up" },
  { name: "increment", label: "Move down" },
];

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function projectIndex(from: number, translationY: number, total: number): number {
  "worklet";
  const steps = Math.round(translationY / ROW_HEIGHT);
  return Math.max(0, Math.min(total - 1, from + steps));
}

type NativeListReorderOptions = ListReorderOptions &
  Readonly<{
    /** The current source-of-truth order (e.g. `rows.map(row => row.id)`). */
    ids: readonly string[];
  }>;

type HandleProps = Readonly<{
  accessibilityActions: readonly AccessibilityActionInfo[];
  accessibilityState: Readonly<{ disabled: boolean; selected: boolean }>;
  onAccessibilityAction: (event: AccessibilityActionEvent) => void;
  gesture: PanGesture;
}>;

type RowProps = Readonly<{
  accessible: boolean;
  /** This row's position in the committed `order` — fixed for the whole drag. */
  index: number;
  total: number;
  /** Raw finger delta since the drag started; meaningless unless `activeOriginalIndex` is this
   * row's own `index`. */
  translationY: SharedValue<number>;
  /** `order` index of the row currently being dragged, or -1 when nothing is. Shared across every
   * row so each one's own animated style can derive its shift purely on the UI thread — no React
   * re-render happens until the drag actually drops. */
  activeOriginalIndex: SharedValue<number>;
  isActive: boolean;
}>;

export type ListReorderBindings = ListReorderState &
  Readonly<{
    /** The committed order. Only changes once per drag, on drop — never mid-gesture. */
    order: readonly string[];
    getHandleProps: (id: string) => HandleProps;
    getRowProps: (id: string) => RowProps;
  }>;

export function useListReorder({
  ids: sourceIds,
  onMove,
  disabled = false,
}: NativeListReorderOptions): ListReorderBindings {
  const [order, setOrder] = useState<readonly string[]>(sourceIds);
  const orderRef = useRef(order);
  orderRef.current = order;
  const activeId = useRef<string | null>(null);
  const lastAnnouncedIndex = useRef(-1);
  const [announcement, setAnnouncement] = useState("");
  const [keyboardPickedUpId, setKeyboardPickedUpId] = useState<string | null>(null);
  const translationY = useSharedValue(0);
  const activeOriginalIndex = useSharedValue(NO_ACTIVE_INDEX);

  // Only follows the source of truth while nothing is being dragged: a drag commits into `order`
  // once, on drop (see handleDragEnd) — never mid-gesture, so there's nothing to reconcile here
  // while one is in progress.
  useEffect(() => {
    if (activeId.current !== null) return;
    setOrder(previous => (sameIds(previous, sourceIds) ? previous : sourceIds));
  }, [sourceIds]);

  const moveBy = useCallback(
    (id: string, offset: number) => {
      const current = orderRef.current;
      const fromIndex = current.indexOf(id);
      const toIndex = Math.max(0, Math.min(current.length - 1, fromIndex + offset));
      if (fromIndex >= 0 && fromIndex !== toIndex) {
        setOrder(reorderByIndex(current, fromIndex, toIndex));
        onMove(id, toIndex);
        setAnnouncement(`Moved item to position ${toIndex + 1}.`);
      }
    },
    [onMove],
  );

  const handleDragStart = useCallback((id: string) => {
    setKeyboardPickedUpId(id);
    setAnnouncement("Item picked up.");
  }, []);

  // Purely for the accessibility live-region text — every visual frame is computed on the UI
  // thread directly from `translationY`/`activeOriginalIndex`, so this only needs to run once per
  // crossed row, not once per touch-move frame.
  const handleDragProgress = useCallback(
    (id: string, translationYValue: number) => {
      if (activeId.current !== id) return;
      const from = activeOriginalIndex.value;
      if (from < 0) return;
      const toIndex = projectIndex(from, translationYValue, orderRef.current.length);
      if (toIndex === lastAnnouncedIndex.current) return;
      lastAnnouncedIndex.current = toIndex;
      setAnnouncement(`Moved item to position ${toIndex + 1}.`);
    },
    [activeOriginalIndex],
  );

  const handleDragEnd = useCallback(
    (id: string, translationYValue: number) => {
      if (activeId.current !== id) return;
      const from = activeOriginalIndex.value;
      activeId.current = null;
      setKeyboardPickedUpId(null);
      setAnnouncement("Item dropped.");

      if (from < 0) return;
      const toIndex = projectIndex(from, translationYValue, orderRef.current.length);

      if (from === toIndex) {
        activeOriginalIndex.value = NO_ACTIVE_INDEX;
        translationY.value = withTiming(0, SETTLE_TIMING);
        return;
      }

      setOrder(reorderByIndex(orderRef.current, from, toIndex));
      onMove(id, toIndex);

      // Both re-anchored synchronously, in the same tick as the `setOrder` above: React's commit
      // for the reordered rows can land whenever it likes, since by the time it does, every row's
      // shift math — including this one, now pointed at its real new index — already reads as
      // settled. No frame-timing guess needed (an earlier version deferred this reset to the next
      // animation frame; it raced React's commit and the row visibly snapped back beforehand).
      translationY.value = translationYValue - (toIndex - from) * ROW_HEIGHT;
      activeOriginalIndex.value = toIndex;
      translationY.value = withTiming(0, SETTLE_TIMING);
    },
    [onMove, activeOriginalIndex, translationY],
  );

  const handleDragReset = useCallback(
    (id: string) => {
      if (activeId.current !== id) return;
      activeId.current = null;
      activeOriginalIndex.value = NO_ACTIVE_INDEX;
      setKeyboardPickedUpId(null);
    },
    [activeOriginalIndex],
  );

  // `handleDragStart`'s own `setKeyboardPickedUpId` re-renders this hook's consumer mid-gesture
  // (needed for the lift/scale visual). If the gesture object below were rebuilt in response —
  // which it would be, being a `useCallback` depending on these handlers — react-native-
  // gesture-handler would be handed a new `Gesture.Pan()` identity while a touch is still down on
  // it, orphaning the in-flight native gesture: `.onEnd`/`.onFinalize` on the *new* object then
  // never fire for that touch, so a drop never resets anything and the row is left wherever the
  // finger let go. Routing through refs keeps every gesture's identity — built once per row id —
  // stable across every re-render, while still always calling the latest closures.
  const latestHandlers = useRef({
    handleDragStart,
    handleDragProgress,
    handleDragEnd,
    handleDragReset,
  });
  latestHandlers.current = { handleDragStart, handleDragProgress, handleDragEnd, handleDragReset };
  const gestureCache = useRef(new Map<string, PanGesture>());

  const getHandleProps = useCallback(
    (id: string): HandleProps => {
      let gesture = gestureCache.current.get(id);
      if (!gesture) {
        // `activateAfterLongPress` keeps the handle still (not tracking) until the long-press
        // threshold elapses, so the enclosing BottomSheetScrollView's own pan gesture claims
        // plain scroll touches; only once activated does this gesture take over the touch
        // stream, instead of a bare Pressable + onTouchMove, which the scroll view's gesture
        // responder cancels the moment it sees vertical movement.
        gesture = Gesture.Pan()
          .activateAfterLongPress(LONG_PRESS_ACTIVATION_MS)
          .onStart(() => {
            activeOriginalIndex.value = orderRef.current.indexOf(id);
            translationY.value = 0;
            scheduleOnRN(latestHandlers.current.handleDragStart, id);
          })
          .onUpdate(event => {
            // Written straight from the UI thread: every row's own animated style reads these
            // two values directly, so the whole preview — the dragged row following the finger,
            // every sibling shifting out of the way — runs at 60fps with no JS round trip and no
            // React re-render for the length of the gesture.
            translationY.value = event.translationY;
            scheduleOnRN(latestHandlers.current.handleDragProgress, id, event.translationY);
          })
          .onEnd(event => {
            scheduleOnRN(latestHandlers.current.handleDragEnd, id, event.translationY);
          })
          .onFinalize(() => {
            // Covers a cancel or a fail (e.g. the scroll view winning the gesture before
            // activation); a successful end already reset this in handleDragEnd, so this is a
            // no-op there (guarded by the `activeId` check).
            scheduleOnRN(latestHandlers.current.handleDragReset, id);
          });
        gestureCache.current.set(id, gesture);
      }
      gesture.enabled(!disabled);

      return {
        accessibilityActions,
        accessibilityState: { disabled, selected: keyboardPickedUpId === id },
        onAccessibilityAction: event => {
          if (disabled) return;
          if (event.nativeEvent.actionName === "decrement") moveBy(id, -1);
          if (event.nativeEvent.actionName === "increment") moveBy(id, 1);
        },
        gesture,
      };
    },
    [disabled, keyboardPickedUpId, moveBy, translationY, activeOriginalIndex],
  );

  const getRowProps = useCallback(
    (id: string): RowProps => ({
      accessible: false,
      index: orderRef.current.indexOf(id),
      total: orderRef.current.length,
      translationY,
      activeOriginalIndex,
      isActive: keyboardPickedUpId === id,
    }),
    [translationY, activeOriginalIndex, keyboardPickedUpId],
  );

  return { order, getHandleProps, getRowProps, announcement, keyboardPickedUpId };
}
