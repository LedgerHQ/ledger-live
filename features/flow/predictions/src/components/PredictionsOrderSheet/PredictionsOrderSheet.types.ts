import type { PredictionsOrderOutcome } from "@features/platform-predictions";
import type { ShownOrder } from "../../predictionsOrderStore.internals";

export type PredictionsOrderSheetViewProps = Readonly<{
  isOpen: boolean;
  shownOrder: ShownOrder | null;
  /** Called once each order is on screen. */
  onPresented: () => void;
  onClose: () => void;
  onRetry: () => void;
}>;

export type OrderContentProps = Readonly<{
  /** Null while the order is being placed. */
  outcome: PredictionsOrderOutcome | null;
  onClose: () => void;
  onRetry: () => void;
}>;
