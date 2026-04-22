import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import type { Account } from "@ledgerhq/types-live";
import { useDispatch } from "LLD/hooks/redux";
import { useCallback } from "react";
import { closeModal, openModal } from "~/renderer/actions/modals";
import type { NavigationSnapshot } from "../../hooks/topologyChangeError";
import type { OnboardingResult } from "../types";
import { prepareAccountsForAdding } from "../utils/accountPreparation";

export interface UseOnboardingNavigationParams {
  selectedAccounts: Account[];
  existingAccounts: Account[];
  editedNames: { [accountId: string]: string };
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  navigationSnapshot?: NavigationSnapshot;
  onboardingResult?: OnboardingResult;
}

export function useOnboardingNavigation({
  selectedAccounts,
  existingAccounts,
  editedNames,
  isReonboarding,
  accountToReonboard,
  navigationSnapshot,
  onboardingResult,
}: UseOnboardingNavigationParams) {
  const dispatch = useDispatch();

  const handleAddAccounts = useCallback(() => {
    const { accounts, renamings } = prepareAccountsForAdding({
      selectedAccounts,
      editedNames,
      isReonboarding,
      accountToReonboard,
      onboardingResult,
    });

    dispatch(
      addAccountsAction({
        scannedAccounts: accounts,
        existingAccounts,
        selectedIds: accounts.map(account => account.id),
        renamings,
      }),
    );

    dispatch(closeModal("MODAL_CANTON_ONBOARD_ACCOUNT"));

    if (isReonboarding && navigationSnapshot) {
      if (navigationSnapshot.type === "modal") {
        dispatch(openModal(navigationSnapshot.modalName, navigationSnapshot.modalData));
      } else if (navigationSnapshot.type === "transfer-proposal") {
        const { action, contractId } = navigationSnapshot.props;
        navigationSnapshot.handler(contractId, action);
      }
    }
  }, [
    selectedAccounts,
    existingAccounts,
    editedNames,
    isReonboarding,
    accountToReonboard,
    navigationSnapshot,
    onboardingResult,
    dispatch,
  ]);

  return {
    handleAddAccounts,
  };
}
