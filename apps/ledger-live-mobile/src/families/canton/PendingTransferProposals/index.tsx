import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCantonAcceptOrRejectOffer } from "@ledgerhq/live-common/families/canton/react";
import { Account } from "@ledgerhq/types-live";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { ScreenRoute } from "../utils/navigationSnapshot";
import DeviceAppModal from "./DeviceAppModal";
import PendingTransferProposalsDetails from "./PendingTransferProposalsDetails";
import ProposalsSection from "./components/ProposalsSection";
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
  isDetailsOpen,
  selectedProposal,
  unit,
  appName,
  account,
  onRowClick,
  onOpenModal,
  onDeviceConfirm,
  onModalClose,
  onDetailsClose,
}: PendingTransferProposalsViewModel) {
  if (incomingCount === 0 && outgoingCount === 0) {
    return null;
  }

  return (
    <>
      <DeviceAppModal
        isOpen={modal.isOpen}
        onConfirm={onDeviceConfirm}
        action={modal.action}
        onClose={onModalClose}
        appName={appName}
      />
      <PendingTransferProposalsDetails
        isOpen={isDetailsOpen}
        proposal={selectedProposal}
        account={account}
        onOpenModal={onOpenModal}
        onClose={onDetailsClose}
      />
      <ProposalsSection
        proposals={groupedIncoming}
        titleKey="canton.pendingTransactions.incoming.title"
        account={account}
        unit={unit}
        onRowClick={onRowClick}
        onOpenModal={onOpenModal}
      />
      <ProposalsSection
        proposals={groupedOutgoing}
        titleKey="canton.pendingTransactions.outgoing.title"
        account={account}
        unit={unit}
        onRowClick={onRowClick}
        onOpenModal={onOpenModal}
      />
    </>
  );
}

const PendingTransferProposals: React.FC<Props> = ({ account, parentAccount }) => {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const route = useRoute<ScreenRoute>();
  const sync = useBridgeSync();

  const performTransferInstruction = useCantonAcceptOrRejectOffer({
    currency: parentAccount.currency,
    account: parentAccount,
    partyId: parentAccount.xpub ?? "",
  });

  const viewModel = usePendingTransferProposalsViewModel({
    account,
    parentAccount,
    navigation,
    route,
    performTransferInstruction,
    sync,
  });

  return <View {...viewModel} />;
};

export default PendingTransferProposals;
