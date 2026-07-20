import { BottomSheet } from "@ledgerhq/lumen-ui-rnative";
import {
  useFeatureFlagsToolActions,
  useFeatureFlagsToolState,
  useFlagSelectionActions,
  useFlagSelectionState,
} from "../../context";
import { FlagEditorBottomSheetContent } from "./FlagEditorBottomSheetContent";

export function FlagEditorBottomSheet() {
  const { setOverride, clearOverride } = useFeatureFlagsToolActions();
  const { getFlagDisplayState } = useFeatureFlagsToolState();
  const { bottomSheetRef, closeFlag } = useFlagSelectionActions();
  const { selectedFlagId } = useFlagSelectionState();
  const display = selectedFlagId ? getFlagDisplayState(selectedFlagId) : null;

  return (
    <BottomSheet ref={bottomSheetRef} snapPoints={["60%"]} onDismiss={closeFlag}>
      {display && (
        <FlagEditorBottomSheetContent
          display={display}
          setOverride={setOverride}
          clearOverride={clearOverride}
        />
      )}
    </BottomSheet>
  );
}
