import { useCallback } from "react";
import { useStakePositionDetailsCopy } from "../../copy/useStakePositionLabels";
import { initialOf } from "../../logic/display";
import type { StakePositionNotice } from "../../types";
import type { StakePositionDetailsProps } from "./StakePositionDetails.types";
import type {
  StakePositionDetailsViewProps,
  StakePositionNoticeAppearance,
} from "./StakePositionDetailsView.types";

const NOTICE_APPEARANCE = {
  deactivating: "info",
  missingAuthority: "warning",
  updating: "info",
} as const satisfies Record<StakePositionNotice, StakePositionNoticeAppearance>;

export function useStakePositionDetailsViewModel({
  ticker,
  status,
  totalRewards,
  rewardsHeadline,
  currentBalance,
  initialDeposit,
  apy,
  validator,
  accountName,
  accountIcon,
  exitAction,
  isExitActionPending,
  notice,
  showEarnMore,
  onEarnMore,
  onSelectExitAction,
  testID,
}: StakePositionDetailsProps): StakePositionDetailsViewProps {
  const copy = useStakePositionDetailsCopy({ ticker, status, exitAction, notice, apy });

  const selectExitAction = useCallback(() => {
    if (exitAction !== null) onSelectExitAction(exitAction);
  }, [exitAction, onSelectExitAction]);

  return {
    labels: copy.labels,
    rewards: totalRewards && { amount: totalRewards, headline: rewardsHeadline },
    balance: currentBalance,
    initialDeposit,
    apyBadge: copy.apyBadge,
    status: copy.state,
    account: accountName ? { name: accountName, icon: accountIcon } : undefined,
    validator: validator && { ...validator, initial: initialOf(validator.name) },
    exitAction:
      copy.exitAction === null ? null : { label: copy.exitAction, isDisabled: isExitActionPending },
    notice:
      notice === null || copy.notice === null
        ? null
        : { text: copy.notice, appearance: NOTICE_APPEARANCE[notice] },
    showEarnMore,
    onEarnMore,
    onSelectExitAction: selectExitAction,
    testID,
  };
}
