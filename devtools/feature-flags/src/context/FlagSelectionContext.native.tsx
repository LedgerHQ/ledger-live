import type { PropsWithChildren } from "react";
import { useCallback, useMemo } from "react";
import { createSafeContext } from "@ledgerhq/lumen-utils-shared";
import { useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import type { FeatureId } from "@shared/feature-flags";
import { useFlagSelection } from "../hooks";

export interface FlagSelectionActions {
  bottomSheetRef: ReturnType<typeof useBottomSheetRef>;
  openFlag: (id: FeatureId) => void;
  closeFlag: () => void;
}

export interface FlagSelectionState {
  selectedFlagId: FeatureId | null;
}

const [ActionsProvider, useActions] =
  createSafeContext<FlagSelectionActions>("FlagSelectionActions");
const [StateProvider, useSelectionState] =
  createSafeContext<FlagSelectionState>("FlagSelectionState");

export function FlagSelectionProvider({ children }: PropsWithChildren) {
  const { selectedFlagId, selectFlag, clearSelection } = useFlagSelection();
  const bottomSheetRef = useBottomSheetRef();

  const openFlag = useCallback(
    (id: FeatureId) => {
      selectFlag(id);
      bottomSheetRef.current?.present();
    },
    [selectFlag, bottomSheetRef],
  );

  const closeFlag = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    clearSelection();
  }, [clearSelection, bottomSheetRef]);

  const actions = useMemo<FlagSelectionActions>(
    () => ({ bottomSheetRef, openFlag, closeFlag }),
    [bottomSheetRef, openFlag, closeFlag],
  );
  const state = useMemo<FlagSelectionState>(() => ({ selectedFlagId }), [selectedFlagId]);

  return (
    <ActionsProvider value={actions}>
      <StateProvider value={state}>{children}</StateProvider>
    </ActionsProvider>
  );
}

export function useFlagSelectionActions(): FlagSelectionActions {
  return useActions({ consumerName: "useFlagSelectionActions", contextRequired: true });
}

// Used solely for the FlagEditorBottomSheet to get the selected flag id and display it
export function useFlagSelectionState(): FlagSelectionState {
  return useSelectionState({ consumerName: "useFlagSelectionState", contextRequired: true });
}
