import { BottomSheet, type BottomSheetProps } from "@ledgerhq/lumen-ui-rnative";
import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import type React from "react";

/**
 * gorhom props that Lumen forwards but does not declare.
 *
 * Lumen's `BottomSheet` spreads `{...props}` into `BottomSheetModal` *before* setting its own
 * options, so anything it leaves alone reaches gorhom untouched. Its `BottomSheetProps` is a closed
 * object type though, so these have to be re-attached by hand.
 *
 * Only props Lumen never sets after the spread belong here. `keyboardBehavior` does not qualify:
 * Lumen pins it to `extend` after the spread, so it cannot be overridden from the outside.
 */
export type LumenForwardedGorhomProps = Readonly<{
  /**
   * Renders above the sheet content in a container that tracks the keyboard, which is the only
   * position that survives the keyboard without manual inset math.
   */
  footerComponent?: React.FC<BottomSheetFooterProps>;
  /**
   * Whether the Android window shrinks under the keyboard. On `adjustResize` gorhom assumes the OS
   * already made room and stops offsetting the keyboard itself, so this has to describe what the
   * window really does rather than what the manifest asks for.
   */
  android_keyboardInputMode?: "adjustPan" | "adjustResize";
}>;

/**
 * Lumen's `BottomSheet`, typed to also accept the gorhom props it forwards blindly.
 *
 * Revisit on every `@ledgerhq/lumen-ui-rnative` upgrade: if Lumen starts setting one of
 * {@link LumenForwardedGorhomProps} after its own spread, that prop silently stops taking effect.
 * The durable fix is for Lumen to declare them.
 */
export const GorhomForwardingBottomSheet = BottomSheet as React.FC<
  BottomSheetProps & LumenForwardedGorhomProps
>;
