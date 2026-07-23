import { isCantonAccount } from "@ledgerhq/coin-canton";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useFeature } from "@features/platform-feature-flags";
import {
  buildUnitResolver,
  byTokenAndDate,
} from "@ledgerhq/live-common/families/canton/proposalSorting";
import { useCantonAcceptOrRejectOffer } from "@ledgerhq/live-common/families/canton/react";
import { Account } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useCallback, useMemo, useState } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { handleTopologyChangeError, TopologyChangeError } from "../hooks/topologyChangeError";
import PendingTransferProposalsDetails from "./PendingTransferProposalsDetails";
import type { GroupedProposals, Modal, ProcessedProposal, TransferProposalAction } from "./types";
import {
  groupByDay,
  INSTRUCTION_TYPE_MAP,
  processTransferProposals,
} from "./utils/transferProposals";

const EMPTY_PROPOSALS: {
  groupedIncoming: GroupedProposals;
  groupedOutgoing: GroupedProposals;
  incomingCount: number;
  outgoingCount: number;
  allProposals: ProcessedProposal[];
} = {
  groupedIncoming: [],
  groupedOutgoing: [],
  incomingCount: 0,
  outgoingCount: 0,
  allProposals: [],
};

export type PendingTransferProposalsViewModel = {
  groupedIncoming: GroupedProposals;
  groupedOutgoing: GroupedProposals;
  incomingCount: number;
  outgoingCount: number;
  modal: Modal;
  unit: ReturnType<typeof useAccountUnit>;
  appName: string;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
  onDeviceConfirm: (deviceId: string) => Promise<void>;
  onModalClose: () => void;
};

export function usePendingTransferProposalsViewModel(
  account: Account,
  parentAccount: Account,
): PendingTransferProposalsViewModel {
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const unit = useAccountUnit(account);
  const sync = useBridgeSync();
  const lldModularDrawer = useFeature("lldModularDrawer");
  const useModularDrawer = !!lldModularDrawer?.enabled;
  const [modal, setModal] = useState<Modal>({ isOpen: false, action: "accept", contractId: "" });

  const accountXpub = parentAccount.xpub ?? "";

  const performTransferInstruction = useCantonAcceptOrRejectOffer({
    currency: parentAccount.currency,
    account: parentAccount,
    partyId: accountXpub,
  });

  const { groupedIncoming, groupedOutgoing, incomingCount, outgoingCount, allProposals } =
    useMemo(() => {
      if (!isCantonAccount(account)) return EMPTY_PROPOSALS;

      const pendingTransferProposals = account.cantonResources?.pendingTransferProposals ?? [];
      const { incoming, outgoing } = processTransferProposals(
        pendingTransferProposals,
        accountXpub,
        buildUnitResolver(parentAccount),
      );

      incoming.sort(byTokenAndDate);
      outgoing.sort(byTokenAndDate);

      return {
        groupedIncoming: groupByDay(incoming),
        groupedOutgoing: groupByDay(outgoing),
        incomingCount: incoming.length,
        outgoingCount: outgoing.length,
        allProposals: [...incoming, ...outgoing],
      };
    }, [account, accountXpub, parentAccount]);

  const onOpenModal = useCallback((contractId: string, action: TransferProposalAction) => {
    setModal({ isOpen: true, action, contractId });
  }, []);

  const onModalClose = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleModalConfirm = useCallback(
    async (contractId: string, action: TransferProposalAction, deviceId: string) => {
      try {
        const instructionType = INSTRUCTION_TYPE_MAP[action];
        await performTransferInstruction({ contractId, deviceId, reason: "" }, instructionType);

        sync({
          type: "SYNC_ONE_ACCOUNT",
          accountId: parentAccount.id,
          priority: 10,
          reason: "canton-pending-transaction-action",
        });
      } catch (error) {
        if (error instanceof TopologyChangeError) {
          setModal(prev => ({ ...prev, isOpen: false }));
          if (device) {
            handleTopologyChangeError(dispatch, {
              currency: parentAccount.currency,
              device,
              mainAccount: parentAccount,
              useModularDrawer,
              navigationSnapshot: {
                type: "transfer-proposal",
                handler: onOpenModal,
                props: { action, contractId },
              },
            });
          }
          return;
        }
        throw error;
      }
    },
    [
      performTransferInstruction,
      sync,
      parentAccount,
      dispatch,
      device,
      onOpenModal,
      useModularDrawer,
    ],
  );

  const onDeviceConfirm = useCallback(
    async (deviceId: string) => {
      await handleModalConfirm(modal.contractId, modal.action, deviceId);
    },
    [handleModalConfirm, modal.contractId, modal.action],
  );

  const onRowClick = useCallback(
    (contractId: string) => {
      const proposal = allProposals.find(p => p.contractId === contractId) ?? null;
      setDrawer(PendingTransferProposalsDetails, {
        account,
        proposal,
        onOpenModal,
      });
    },
    [account, allProposals, onOpenModal],
  );

  const appName = parentAccount.currency.managerAppName;

  return {
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
  };
}
