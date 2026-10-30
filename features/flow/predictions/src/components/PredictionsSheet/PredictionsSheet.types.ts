import type { ShownStep } from "../../predictionsSheetStore.internals";

export type PredictionsSheetViewProps = Readonly<{
  isOpen: boolean;
  shownStep: ShownStep | null;
  onDismiss: () => void;
}>;
