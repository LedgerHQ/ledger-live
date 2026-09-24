import { useCallback, useEffect } from "react";
import {
  TextInput,
  findNodeHandle,
  type NativeSyntheticEvent,
  type TargetedEvent,
} from "react-native";
import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import type React from "react";
import { useBottomSheetId } from "../internals/BottomSheetInstanceContext";
import {
  claimBottomSheetKeyboard,
  releaseBottomSheetKeyboard,
} from "../internals/bottomSheetKeyboardOwnership";

type FocusEvent = NativeSyntheticEvent<TargetedEvent>;

type BottomSheetKeyboardAwareInputProps = Readonly<{
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
}>;

export function useBottomSheetKeyboardAwareInput(
  inputRef: React.RefObject<TextInput | null>,
): BottomSheetKeyboardAwareInputProps {
  const bottomSheet = useBottomSheetInternal(true);
  const sheetId = useBottomSheetId();

  useEffect(() => {
    if (bottomSheet === null) {
      return;
    }

    const { animatedKeyboardState, textInputNodesRef } = bottomSheet;
    const node = findNodeHandle(inputRef.current);
    if (node === null) {
      return;
    }

    textInputNodesRef.current.add(node);

    return () => {
      textInputNodesRef.current.delete(node);
      if (animatedKeyboardState.get().target === node) {
        animatedKeyboardState.set({ ...animatedKeyboardState.get(), target: undefined });
      }
    };
  }, [bottomSheet, inputRef]);

  const onFocus = useCallback(
    (event: FocusEvent) => {
      if (sheetId !== null) {
        claimBottomSheetKeyboard(sheetId);
      }

      if (bottomSheet === null) return;

      const { animatedKeyboardState } = bottomSheet;
      animatedKeyboardState.set({
        ...animatedKeyboardState.get(),
        target: event.nativeEvent.target,
      });
    },
    [bottomSheet, sheetId],
  );

  const onBlur = useCallback(
    (event: FocusEvent) => {
      if (bottomSheet === null) {
        if (sheetId !== null) {
          releaseBottomSheetKeyboard(sheetId);
        }
        return;
      }

      const { animatedKeyboardState, textInputNodesRef } = bottomSheet;
      const shouldRemoveTarget = animatedKeyboardState.get().target === event.nativeEvent.target;
      const focusedNode = findFocusedInputNode();
      const hasFocusLeftSheet = !focusedNodeBelongsToSheet(focusedNode, textInputNodesRef.current);

      if (hasFocusLeftSheet && sheetId !== null) {
        releaseBottomSheetKeyboard(sheetId);
      }

      if (shouldRemoveTarget && hasFocusLeftSheet) {
        animatedKeyboardState.set({ ...animatedKeyboardState.get(), target: undefined });
      }
    },
    [bottomSheet, sheetId],
  );

  return { onFocus, onBlur };
}

function findFocusedInputNode(): number | null {
  const focused = TextInput.State.currentlyFocusedInput();
  return findNodeHandle(focused as unknown as React.Component);
}

function focusedNodeBelongsToSheet(focusedNode: number | null, nodes: Set<number>): boolean {
  return focusedNode !== null && nodes.has(focusedNode);
}
