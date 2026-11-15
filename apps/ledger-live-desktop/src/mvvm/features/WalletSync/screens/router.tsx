import React, { forwardRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import { Flow, walletSyncFlowSelector } from "~/renderer/reducers/walletSync";
import WalletSyncManageBackup from "./ManageBackup";
import SynchronizeWallet from "./Synchronize";
import WalletSyncManageInstances from "./ManageInstances";
import WalletSyncActivation from "./Activation";
import WalletSyncManage from "./Manage";
import { useInitMemberCredentials } from "../hooks/useInitMemberCredentials";
import { AnalyticsPage } from "../hooks/useLedgerSyncAnalytics";
import type { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";

export interface BackRef {
  goBack: () => void;
}

export interface Props {
  currentPage: AnalyticsPage;
}

type RouterProps = Props & {
  selectedInstance: TrustchainMember | null;
  onSelectInstance: (instance: TrustchainMember) => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BackProps {}

export const WalletSyncRouter = forwardRef<BackRef, RouterProps>(
  ({ currentPage, selectedInstance, onSelectInstance }, ref) => {
    useInitMemberCredentials();
    const walletSyncFlow = useSelector(walletSyncFlowSelector);

    switch (walletSyncFlow) {
      default:
      case Flow.Activation:
        return <WalletSyncActivation ref={ref} sourcePage={currentPage} />;
      case Flow.LedgerSyncActivated:
        return <WalletSyncManage currentPage={currentPage} />;
      case Flow.Synchronize:
        return <SynchronizeWallet ref={ref} currentPage={currentPage} />;
      case Flow.ManageBackup:
        return <WalletSyncManageBackup ref={ref} />;
      case Flow.ManageInstances:
        return (
          <WalletSyncManageInstances
            ref={ref}
            selectedInstance={selectedInstance}
            onSelectInstance={onSelectInstance}
          />
        );
    }
  },
);

WalletSyncRouter.displayName = "WalletSyncRouter";
