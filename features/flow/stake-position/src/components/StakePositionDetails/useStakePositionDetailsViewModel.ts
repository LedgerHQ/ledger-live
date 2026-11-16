import { useCallback } from "react";
import { useStakePositionDetailsLabels } from "../../copy/useStakePositionLabels";
import type { StakePositionNotice, StakePositionState } from "../../types";
import { initialOf, middleEllipsis } from "./display";
import type { StakePositionDetailsProps } from "./StakePositionDetails.types";
import type {
  StakePositionDetailsViewProps,
  StakePositionNoticeAppearance,
  StakePositionStatusAppearance,
} from "./StakePositionDetailsView.types";

// Same tones as the Solana delegations of Account Detail.
const STATUS_APPEARANCE = {
  active: "success",
  activating: "warning",
  deactivating: "warning",
  inactive: "error",
} as const satisfies Record<StakePositionState, StakePositionStatusAppearance>;

const NOTICE_APPEARANCE = {
  deactivating: "info",
  missingAuthority: "warning",
} as const satisfies Record<StakePositionNotice, StakePositionNoticeAppearance>;

export function useStakePositionDetailsViewModel({
  ticker,
  state,
  balance,
  rewards,
  apy,
  validator,
  address,
  exitAction,
  notice,
  isExitActionPending,
  onEarnMore,
  onSelectExitAction,
  testID,
}: StakePositionDetailsProps): StakePositionDetailsViewProps {
  const labels = useStakePositionDetailsLabels({ ticker, state, exitAction, notice });

  const selectExitAction = useCallback(() => {
    if (exitAction !== null) onSelectExitAction(exitAction);
  }, [exitAction, onSelectExitAction]);

  return {
    labels,
    balance,
    rewards,
    status: { label: labels.state, appearance: STATUS_APPEARANCE[state] },
    apy: apy ?? labels.unavailableValue,
    validator: { ...validator, initial: initialOf(validator.name) },
    address: middleEllipsis(address),
    exitAction:
      labels.exitAction === null
        ? null
        : { label: labels.exitAction, isDisabled: isExitActionPending },
    notice:
      notice === null || labels.notice === null
        ? null
        : { text: labels.notice, appearance: NOTICE_APPEARANCE[notice] },
    onEarnMore,
    onSelectExitAction: selectExitAction,
    testID,
  };
}
