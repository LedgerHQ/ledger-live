import { useCallback, useRef, useState } from "react";
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  GestureResponderEvent,
} from "react-native";
import { reorderByIndex } from "./reorderByIndex";
import type { ListReorderOptions, ListReorderState } from "./types";

const accessibilityActions: readonly AccessibilityActionInfo[] = [
  { name: "decrement", label: "Move up" },
  { name: "increment", label: "Move down" },
];

type HandleProps = Readonly<{
  accessibilityActions: readonly AccessibilityActionInfo[];
  accessibilityState: Readonly<{ disabled: boolean; selected: boolean }>;
  onAccessibilityAction: (event: AccessibilityActionEvent) => void;
  onLongPress: (event: GestureResponderEvent) => void;
  onPressOut: () => void;
  onTouchMove: (event: GestureResponderEvent) => void;
}>;

type RowProps = Readonly<{
  accessible: boolean;
}>;

export type ListReorderBindings = ListReorderState &
  Readonly<{
    getHandleProps: (id: string) => HandleProps;
    getRowProps: (id: string) => RowProps;
  }>;

export function useListReorder({
  onMove,
  disabled = false,
}: ListReorderOptions): ListReorderBindings {
  const ids = useRef<string[]>([]);
  const activeId = useRef<string | null>(null);
  const dragStartY = useRef(0);
  const lastDragIndex = useRef(-1);
  const [announcement, setAnnouncement] = useState("");
  const [keyboardPickedUpId, setKeyboardPickedUpId] = useState<string | null>(null);

  const moveBy = useCallback(
    (id: string, offset: number) => {
      const fromIndex = ids.current.indexOf(id);
      const toIndex = Math.max(0, Math.min(ids.current.length - 1, fromIndex + offset));
      if (fromIndex >= 0 && fromIndex !== toIndex) {
        ids.current = reorderByIndex(ids.current, fromIndex, toIndex);
        onMove(id, toIndex);
        setAnnouncement(`Moved item to position ${toIndex + 1}.`);
      }
    },
    [onMove],
  );

  const getHandleProps = useCallback(
    (id: string): HandleProps => ({
      accessibilityActions,
      accessibilityState: { disabled, selected: keyboardPickedUpId === id },
      onAccessibilityAction: event => {
        if (disabled) return;
        if (event.nativeEvent.actionName === "decrement") moveBy(id, -1);
        if (event.nativeEvent.actionName === "increment") moveBy(id, 1);
      },
      onLongPress: event => {
        if (disabled) return;
        activeId.current = id;
        dragStartY.current = event.nativeEvent.pageY;
        lastDragIndex.current = ids.current.indexOf(id);
        setKeyboardPickedUpId(id);
        setAnnouncement("Item picked up.");
      },
      onPressOut: () => {
        if (activeId.current !== id) return;
        activeId.current = null;
        setKeyboardPickedUpId(null);
        setAnnouncement("Item dropped.");
      },
      onTouchMove: event => {
        if (activeId.current !== id || disabled) return;
        const fromIndex = ids.current.indexOf(id);
        const offset = Math.round((event.nativeEvent.pageY - dragStartY.current) / 48);
        const toIndex = Math.max(0, Math.min(ids.current.length - 1, fromIndex + offset));
        if (toIndex !== lastDragIndex.current) {
          lastDragIndex.current = toIndex;
          ids.current = reorderByIndex(ids.current, fromIndex, toIndex);
          dragStartY.current = event.nativeEvent.pageY;
          onMove(id, toIndex);
          setAnnouncement(`Moved item to position ${toIndex + 1}.`);
        }
      },
    }),
    [disabled, keyboardPickedUpId, moveBy, onMove],
  );

  const getRowProps = useCallback((id: string): RowProps => {
    if (!ids.current.includes(id)) ids.current.push(id);
    return {
      accessible: false,
    };
  }, []);

  return { getHandleProps, getRowProps, announcement, keyboardPickedUpId };
}
