import type React from "react";
import type { BottomSheetProps } from "@ledgerhq/lumen-ui-rnative";

export type QueuedBottomSheetProps = Readonly<{
  /** Whether this drawer is requesting to be opened (queued). */
  isRequestingToBeOpened?: boolean;
  /** Whether this drawer should force-open (clears queue). */
  isForcingToBeOpened?: boolean;
  /** Hide the close button in the header. */
  noCloseButton?: boolean;
  /** Show a back button in the header. */
  hasBackButton?: boolean;
  /** Hide the handle. */
  hideHandle?: boolean;
  /** Callback when back button is pressed. */
  onBack?: () => void;
  /** Callback when the drawer is closed. */
  onClose?: () => void;
  /**
   * Callback when the header close button (X) is pressed. Unlike {@link onClose}, which can fire
   * for any closing reason (header, backdrop, gestures, or programmatic dismiss), this fires only
   * on an explicit header close press. Use it to track close intent accurately.
   */
  onHeaderClosePressed?: () => void;
  /**
   * Callback when the backdrop is pressed. Fires only on an explicit backdrop press, before the
   * drawer is dismissed. Use it to track close intent accurately.
   */
  onBackdropPress?: () => void;
  /**
   * Callback after the drawer has finished animating open and settled on its snap point. Use it to
   * defer work that would otherwise compete with the opening animation, such as focusing an input
   * (which raises the keyboard and, with {@link enableDynamicSizing}, resizes the drawer mid-flight).
   */
  onOpened?: () => void;
  /** Callback after the drawer is fully hidden. */
  onModalHide?: () => void;
  /** Prevent closing via backdrop press. */
  preventBackdropClick?: boolean;
  /** Snap points for the bottom sheet. */
  snapPoints?: BottomSheetProps["snapPoints"];
  /** Enable dynamic sizing based on content. */
  enableDynamicSizing?: boolean;
  /** Enable pan-down-to-close gesture. */
  enablePanDownToClose?: boolean;
  /** Enable blur keyboard on gesture interaction. */
  enableBlurKeyboardOnGesture?: boolean;
  /** Enable handle panning gesture. */
  enableHandlePanningGesture?: boolean;
  /** Maximum dynamic content size. */
  maxDynamicContentSize?: BottomSheetProps["maxDynamicContentSize"];
  /** Test ID for end-to-end tests. */
  testID?: string;
  /** Content of the drawer. */
  children: React.ReactNode;
}>;
