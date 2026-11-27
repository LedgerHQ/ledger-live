import React from "react";
import { Account } from "@ledgerhq/types-live";
import DeviceAppModal from "./DeviceAppModal";
import ProposalsTable from "./components/ProposalsTable";
import {
  usePendingTransferProposalsViewModel,
  type PendingTransferProposalsViewModel,
} from "./usePendingTransferProposalsViewModel";

type Props = {
  account: Account;
  parentAccount: Account;
};

export function View({
  groupedIncoming,
  groupedOutgoing,
  incomingCount,
  outgoingCount,
  modal,
  unit,
  appName,
  onRowClick,
  onOpenModal,
  onDeviceConfirm,
  onModalClose,
}: PendingTransferProposalsViewModel) {
  const hasProposals = incomingCount > 0 || outgoingCount > 0;

  // The modal outlives the list: unmounted while open, it would reopen on the next offer and replay its action
  return (
    <>
      <DeviceAppModal
        isOpen={modal.isOpen}
        onConfirm={onDeviceConfirm}
        action={modal.action}
        onClose={onModalClose}
        appName={appName}
      />
      {hasProposals && (
        <>
          <ProposalsTable
            proposals={groupedIncoming}
            count={incomingCount}
            titleKey="families.canton.pendingTransactions.incoming.title"
            isIncomingTable={true}
            unit={unit}
            onRowClick={onRowClick}
            onOpenModal={onOpenModal}
          />
          <ProposalsTable
            proposals={groupedOutgoing}
            count={outgoingCount}
            titleKey="families.canton.pendingTransactions.outgoing.title"
            isIncomingTable={false}
            unit={unit}
            onRowClick={onRowClick}
            onOpenModal={onOpenModal}
          />
        </>
      )}
    </>
  );
}

export default function PendingTransferProposals({ account, parentAccount }: Props) {
  return <View {...usePendingTransferProposalsViewModel(account, parentAccount)} />;
}
