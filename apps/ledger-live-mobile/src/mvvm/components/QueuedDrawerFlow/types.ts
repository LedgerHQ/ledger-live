import type { ReactNode } from "react";
import type { QueuedBottomSheetProps } from "@shared/ui-queued-bottom-sheet";

export type QueuedDrawerFlowOptions = Readonly<
  Pick<
    QueuedBottomSheetProps,
    | "enableBlurKeyboardOnGesture"
    | "enableDynamicSizing"
    | "enableHandlePanningGesture"
    | "enablePanDownToClose"
    | "hasBackButton"
    | "hideHandle"
    | "maxDynamicContentSize"
    | "noCloseButton"
    | "onHeaderClosePressed"
    | "preventBackdropClick"
    | "snapPoints"
  >
>;

export type QueuedDrawerFlowScreen = Readonly<{
  content: ReactNode;
  options?: QueuedDrawerFlowOptions;
}>;

export type QueuedDrawerFlowScreenRegistry<Step extends string> = Readonly<
  Record<Step, QueuedDrawerFlowScreen>
>;

export type QueuedDrawerFlowProps<Step extends string> = Readonly<{
  currentStep: Step;
  defaultOptions?: QueuedDrawerFlowOptions;
  isOpen: boolean;
  onBack?: () => void;
  onClose: () => void;
  screens: QueuedDrawerFlowScreenRegistry<Step>;
  testID?: string;
}>;
