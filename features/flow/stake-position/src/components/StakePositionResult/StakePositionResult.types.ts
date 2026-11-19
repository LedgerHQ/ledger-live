import type { ReactNode } from "react";
import type { StakePositionExitAction } from "../../types";

/** The result of the exit. The surface's header closes it: it has no close button of its own. */
export type StakePositionResultProps =
  | Readonly<{
      outcome: "success";
      action: StakePositionExitAction;
      ticker: string;
      /** Opens the broadcast operation. No button without it. */
      onViewTransaction?: () => void;
      testID?: string;
    }>
  | Readonly<{
      outcome: "failure";
      /** What went wrong, as the app renders the error. */
      errorDescription?: ReactNode;
      /** The transaction was signed, so it may still reach the network: the user is warned. */
      isSigned: boolean;
      onRetry: () => void;
      testID?: string;
    }>;
