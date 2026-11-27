import type {
  PredictionsOrderDisplay,
  PredictionsOrderReport,
} from "@features/platform-predictions";
import type { PredictionsOrderDetails, ShownOrder } from "../../predictionsOrderStore.internals";

export type PredictionsOrderSheetViewProps = Readonly<{
  isOpen: boolean;
  shownOrder: ShownOrder | null;
  onPresented: () => void;
  onClose: () => void;
}>;

export type OrderContentProps = Readonly<{
  order: PredictionsOrderDetails;
  report: PredictionsOrderReport | null;
  onClose: () => void;
  onRetry: () => void;
}>;

export type OrderSummaryProps = Readonly<{ display: PredictionsOrderDisplay }>;
