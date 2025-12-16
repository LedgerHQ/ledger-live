import React, { useCallback } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import ModularDialogFlowManager from "LLD/features/ModularDialog/ModularDialogFlowManager";
import { useSendFlowContext } from "../../context/SendFlowContext";

const drawerConfiguration: EnhancedModularDrawerConfiguration = {
  assets: { leftElement: "undefined", rightElement: "balance", filter: "undefined" },
  networks: { leftElement: "undefined", rightElement: "undefined" },
};

export function AccountSelectionScreen() {
  const { setAccountAndNavigate, navigation, close } = useSendFlowContext();

  const handleAccountSelected = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      setAccountAndNavigate(account, parentAccount);
      navigation.goToNextStep();
    },
    [setAccountAndNavigate, navigation],
  );

  return (
    <ModularDialogFlowManager
      currencies={[]}
      onAccountSelected={handleAccountSelected}
      drawerConfiguration={drawerConfiguration}
      onClose={close}
      skipDialogWrapper
    />
  );
}
