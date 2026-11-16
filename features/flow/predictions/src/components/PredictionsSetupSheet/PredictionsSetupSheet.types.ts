import type { PredictionsSetupOutcome } from "@features/platform-predictions";
import type { ShownSetup } from "../../predictionsSetupStore.internals";

export type PredictionsSetupSheetViewProps = Readonly<{
  isOpen: boolean;
  shownSetup: ShownSetup | null;
  /** Called once each setup is on screen. */
  onPresented: () => void;
  onDismiss: () => void;
}>;

export type SetupContentProps = Readonly<{
  /** Null while the trading wallet is being set up. */
  outcome: PredictionsSetupOutcome | null;
  onDismiss: () => void;
}>;
