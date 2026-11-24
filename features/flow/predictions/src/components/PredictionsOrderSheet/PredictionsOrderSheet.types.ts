import type { PredictionsOrderReport } from "@features/platform-predictions";
import type { ShownOrder } from "../../predictionsOrderStore.internals";

export type PredictionsOrderSheetViewProps = Readonly<{
  isOpen: boolean;
  shownOrder: ShownOrder | null;
  onPresented: () => void;
  onClose: () => void;
}>;

export type OrderContentProps = Readonly<{
  report: PredictionsOrderReport | null;
  onClose: () => void;
  onRetry: () => void;
}>;
