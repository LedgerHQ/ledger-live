import React, { useCallback } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { useSendFlowContext } from "../../context/SendFlowContext";
import { useNewSendFlowFeature } from "../../hooks/useNewSendFlowFeature";
import { ModularDialogContent } from "LLD/features/ModularDialog/ModularDialogContent";
import { useModularDialogFlow } from "LLD/features/ModularDialog/hooks/useModularDialogFlow";

const drawerConfiguration: EnhancedModularDrawerConfiguration = {
  assets: { leftElement: "undefined", rightElement: "balance", filter: "undefined" },
  networks: { leftElement: "undefined", rightElement: "undefined" },
};

export function AccountSelectionScreen() {
  const { setAccountAndNavigate, navigation, close } = useSendFlowContext();
  const dispatch = useDispatch();
  const { isEnabledForFamily, getFamilyFromAccount } = useNewSendFlowFeature();

  const handleAccountSelected = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      const family = getFamilyFromAccount(account, parentAccount ?? null);
      const isAllowed = isEnabledForFamily(family);

      // If the selected family isn't allowed for the new flow, fallback to legacy send modal.
      if (!isAllowed) {
        close();
        dispatch(
          openModal("MODAL_SEND", {
            account,
            parentAccount,
          }),
        );
        return;
      }

      setAccountAndNavigate(account, parentAccount);
      navigation.goToNextStep();
    },
    [close, dispatch, navigation, isEnabledForFamily, getFamilyFromAccount, setAccountAndNavigate],
  );

  const { currentStep, navigationDirection, handleBack, renderStepContent } = useModularDialogFlow({
    currencies: [],
    drawerConfiguration,
    onAccountSelected: handleAccountSelected,
  });

  return (
    <div className="h-full px-24">
      <ModularDialogContent
        currentStep={currentStep}
        navigationDirection={navigationDirection}
        handleClose={close}
        handleBack={handleBack}
        renderStepContent={renderStepContent}
      />
    </div>
  );
}
