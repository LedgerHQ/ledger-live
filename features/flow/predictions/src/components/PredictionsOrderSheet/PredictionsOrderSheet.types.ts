import type {
  PredictionsOrderDisplay,
  PredictionsOrderOutcome,
} from "@features/platform-predictions";
import type { PredictionsOrderDetails, ShownOrder } from "../../predictionsOrderStore.internals";

export type PredictionsOrderSheetViewProps = Readonly<{
  isOpen: boolean;
  shownOrder: ShownOrder | null;
  /** Called once each order is on screen. */
  onPresented: () => void;
  onClose: () => void;
  onRetry: () => void;
}>;

export type OrderContentProps = Readonly<{
  order: PredictionsOrderDetails;
  /** Null while the order is being placed. */
  outcome: PredictionsOrderOutcome | null;
  onClose: () => void;
  onRetry: () => void;
}>;

/** The market the order is on, as the live app describes it. */
export type OrderSummaryProps = Readonly<{ display: PredictionsOrderDisplay }>;
