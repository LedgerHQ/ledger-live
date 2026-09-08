import React from "react";
import { Pressable, View } from "react-native";
import type { QueuedBottomSheetProps } from "../components/QueuedBottomSheet/types";

export const QUEUED_BOTTOM_SHEET_MOCK_TEST_ID = "queued-bottom-sheet";

/**
 * Test double for `QueuedBottomSheet`, for tests that render a sheet-hosting view without the
 * queue and adapter providers the real component needs.
 *
 * It renders its children unconditionally: whether the content shows while closed is the
 * consumer's decision, and the test should be able to assert it. Open state is exposed through
 * `accessibilityState.expanded`, and each close/back/open callback through a pressable derived
 * from the sheet `testID`:
 *
 * - `<testID>-dismiss` → `onClose`
 * - `<testID>-header-close` → `onHeaderClosePressed`
 * - `<testID>-backdrop` → `onBackdropPress`
 * - `<testID>-back` → `onBack`
 *
 * `onOpened` fires when the sheet becomes open. Sheets that pass no `testID` fall back to
 * {@link QUEUED_BOTTOM_SHEET_MOCK_TEST_ID}.
 */
export function QueuedBottomSheetMock({
  children,
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onHeaderClosePressed,
  onBackdropPress,
  onBack,
  onOpened,
  testID = QUEUED_BOTTOM_SHEET_MOCK_TEST_ID,
}: QueuedBottomSheetProps) {
  const isOpen = isRequestingToBeOpened || isForcingToBeOpened;

  const onOpenedRef = React.useRef(onOpened);
  onOpenedRef.current = onOpened;

  React.useEffect(() => {
    if (isOpen) onOpenedRef.current?.();
  }, [isOpen]);

  return (
    <View testID={testID} accessibilityState={{ expanded: isOpen }}>
      {onClose ? <Pressable testID={`${testID}-dismiss`} onPress={onClose} /> : null}
      {onHeaderClosePressed ? (
        <Pressable testID={`${testID}-header-close`} onPress={onHeaderClosePressed} />
      ) : null}
      {onBackdropPress ? (
        <Pressable testID={`${testID}-backdrop`} onPress={onBackdropPress} />
      ) : null}
      {onBack ? <Pressable testID={`${testID}-back`} onPress={onBack} /> : null}
      {children}
    </View>
  );
}
