import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { hidePostOnboardingWalletEntryPoint } from "@ledgerhq/live-common/postOnboarding/actions";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { Account, type StartActionArgs } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  closeFinishPostOnboarding,
  selectIsFinishPostOnboardingOpen,
} from "LLD/features/FinishOnboarding/FinishOnboardingDialog/finishOnboardingDialog";
import { resolveFinishPostOnboardingStartAction, type FinishPostOnboardingListItem } from "./utils";
import { usePostOnboardingFinishProgress } from "./usePostOnboardingFinishProgress";

/**
 * {@link FinishPostOnboardingListItem} with a concrete `startAction` for
 * `PostOnboardingAction` (hub actions may omit it; the view model resolves it in one place).
 */
export type FinishOnboardingDialogAction = Omit<FinishPostOnboardingListItem, "startAction"> & {
  readonly startAction: (args: StartActionArgs) => void;
};

export interface FinishOnboardingDialogViewProps {
  /** True when every listed post-onboarding action (excl. device row) is completed. */
  readonly allActionsCompleted: boolean;
  readonly accounts: Account[];
  /**
   * Rows from {@link usePostOnboardingFinishProgress} with `startAction` resolved for the dialog
   * (see {@link resolveFinishPostOnboardingStartAction} in `./utils`).
   */
  readonly actions: FinishOnboardingDialogAction[];
  /** From the hook: hub completed count in `actionList` + 1 (implicit device row, always first). */
  readonly completedActionsAmount: number;
  /** From the hook: `actionList`.length + 1 (same implicit device step in the stepper). */
  readonly totalActionsAmount: number;
  readonly deviceModelId: DeviceModelId | null;
  readonly isLedgerSyncActive: boolean;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onGotIt: () => void;
  readonly onGotItLabel: string;
  readonly title: string;
}

/**
 * Open/close is driven by the global `dialogs` slice (see `finishOnboardingDialog.ts`); the widget
 * dispatches `openFinishPostOnboarding` via `useFinishOnboardingDialog`.
 */
export default function useFinishOnboardingDialogViewModel(): FinishOnboardingDialogViewProps {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isDialogOpen = useSelector(selectIsFinishPostOnboardingOpen);

  const { actionsState, deviceModelId } = usePostOnboardingHubState();
  const isLedgerSyncActive = Boolean(useSelector(trustchainSelector)?.rootId);
  const accounts = useSelector(accountsSelector);

  const { allActionsCompleted, completedActionsAmount, actionList, totalActionsAmount } =
    usePostOnboardingFinishProgress(actionsState);

  const onGotIt = useCallback(() => {
    dispatch(closeFinishPostOnboarding());
    dispatch(hidePostOnboardingWalletEntryPoint());
  }, [dispatch]);

  const onClose = useCallback(() => {
    dispatch(closeFinishPostOnboarding());
  }, [dispatch]);

  return useMemo(
    () => ({
      allActionsCompleted,
      accounts,
      actions: actionList.map(
        (item): FinishOnboardingDialogAction => ({
          ...item,
          startAction: resolveFinishPostOnboardingStartAction(item),
        }),
      ),
      completedActionsAmount,
      deviceModelId,
      isLedgerSyncActive,
      isOpen: isDialogOpen,
      onClose,
      onGotIt,
      onGotItLabel: t("postOnboarding.dialog.primaryLabel"),
      title: t("postOnboarding.dialog.title"),
      totalActionsAmount,
    }),
    [
      accounts,
      allActionsCompleted,
      completedActionsAmount,
      deviceModelId,
      actionList,
      isDialogOpen,
      isLedgerSyncActive,
      onClose,
      onGotIt,
      t,
      totalActionsAmount,
    ],
  );
}
