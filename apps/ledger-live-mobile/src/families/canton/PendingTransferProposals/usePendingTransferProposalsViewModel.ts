import { isCantonAccount } from "@ledgerhq/coin-canton";
import { TopologyChangeError } from "@ledgerhq/coin-canton/types/errors";
import type { Sync } from "@ledgerhq/live-common/bridge/react/types";
import type {
  TransferInstructionParams,
  TransferInstructionType,
} from "@ledgerhq/live-common/families/canton/react";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import {
  createNavigationSnapshot,
  getNavigatorForScreen,
  type NavigationSnapshot,
  type ScreenRoute,
} from "../utils/navigationSnapshot";
import type {
  GroupedProposals,
  Modal,
  ProcessedProposal,
  RestoreModalState,
  TransferProposalAction,
} from "./types";
import {
  groupByDay,
  INSTRUCTION_TYPE_MAP,
  isValidRestoreModalState,
  processTransferProposals,
} from "./utils/transferProposals";

export type PendingTransferProposalsViewModel = {
  groupedIncoming: GroupedProposals;
  groupedOutgoing: GroupedProposals;
  incomingCount: number;
  outgoingCount: number;
  modal: Modal;
  isDetailsOpen: boolean;
  selectedProposal: ProcessedProposal | null;
  unit: Unit;
  appName: string;
  account: Account;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
  onDeviceConfirm: (deviceId: string) => Promise<void>;
  onModalClose: () => void;
  onDetailsClose: () => void;
};

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

export type PerformTransferInstruction = (
  params: TransferInstructionParams,
  type: TransferInstructionType,
) => Promise<void>;

type Input = {
  account: Account;
  parentAccount: Account;
  navigation: NativeStackNavigationProp<BaseNavigatorStackParamList>;
  route: ScreenRoute;
  performTransferInstruction: PerformTransferInstruction;
  sync: Sync;
};

export function usePendingTransferProposalsViewModel({
  account,
  parentAccount,
  navigation,
  route,
  performTransferInstruction,
  sync,
}: Input): PendingTransferProposalsViewModel {
  const unit = useAccountUnit(account);

  const [modal, setModal] = useState<Modal>({ isOpen: false, action: "accept", contractId: "" });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const restoreRef = useRef<RestoreModalState | null>(null);

  const accountXpub = parentAccount.xpub ?? "";

  const cantonAccount = isCantonAccount(parentAccount) ? parentAccount : null;
  const appName = cantonAccount?.currency.managerAppName ?? account.currency.managerAppName;

  const { groupedIncoming, groupedOutgoing, incomingCount, outgoingCount, allProposals } =
    useMemo(() => {
      if (!isCantonAccount(account)) return EMPTY_PROPOSALS;

      const pendingTransferProposals = account.cantonResources?.pendingTransferProposals ?? [];
      const { incoming, outgoing } = processTransferProposals(
        pendingTransferProposals,
        accountXpub,
      );

      return {
        groupedIncoming: groupByDay(incoming),
        groupedOutgoing: groupByDay(outgoing),
        incomingCount: incoming.length,
        outgoingCount: outgoing.length,
        allProposals: [...incoming, ...outgoing],
      };
    }, [account, accountXpub]);

  const selectedProposal = useMemo(
    () => allProposals.find(p => p.contractId === selectedContractId) ?? null,
    [allProposals, selectedContractId],
  );

  const redirectToReonboarding = useCallback(
    (action?: TransferProposalAction, contractId?: string) => {
      const restoreState: NavigationSnapshot =
        action && contractId
          ? {
              type: "transfer-proposal",
              action,
              contractId,
              navigator: getNavigatorForScreen(route.name),
              screen: route.name,
              params: route.params,
            }
          : createNavigationSnapshot(route);

      navigation.navigate(NavigatorName.CantonOnboard, {
        screen: ScreenName.CantonOnboardAccount,
        params: {
          accountsToAdd: [],
          currency: account.currency,
          isReonboarding: true,
          accountToReonboard: account,
          restoreState,
        },
      });
    },
    [account, navigation, route],
  );

  const handleModalConfirm = useCallback(
    async (contractId: string, action: TransferProposalAction, deviceId: string) => {
      try {
        const instructionType = INSTRUCTION_TYPE_MAP[action];
        await performTransferInstruction({ contractId, deviceId, reason: "" }, instructionType);

        sync({
          type: "SYNC_ONE_ACCOUNT",
          accountId: account.id,
          priority: 10,
          reason: "canton-pending-transaction-action",
        });
      } catch (error) {
        if (error instanceof TopologyChangeError) {
          setModal(prev => ({ ...prev, isOpen: false }));
          redirectToReonboarding(action, contractId);
          return;
        }
        throw error;
      }
    },
    [performTransferInstruction, sync, account, redirectToReonboarding],
  );

  const onOpenModal = useCallback((contractId: string, action: TransferProposalAction) => {
    setIsDetailsOpen(false);
    setModal({ isOpen: true, action, contractId });
  }, []);

  const onModalClose = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const onRowClick = useCallback((contractId: string) => {
    setSelectedContractId(contractId);
    setIsDetailsOpen(true);
  }, []);

  const onDetailsClose = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  const onDeviceConfirm = useCallback(
    async (deviceId: string) => {
      await handleModalConfirm(modal.contractId, modal.action, deviceId);
    },
    [handleModalConfirm, modal.contractId, modal.action],
  );

  // Restore modal state after reonboarding completes
  useFocusEffect(
    useCallback(() => {
      const restoreModalState = route.params?.restoreModalState;
      if (!isValidRestoreModalState(restoreModalState)) {
        return;
      }

      const { action, contractId } = restoreModalState;
      navigation.setParams({ restoreModalState: undefined });
      restoreRef.current = { action, contractId };
    }, [route.params?.restoreModalState, navigation]),
  );

  useEffect(() => {
    if (restoreRef.current && !route.params?.restoreModalState) {
      const { action, contractId } = restoreRef.current;
      restoreRef.current = null;
      onOpenModal(contractId, action);
    }
  }, [route.params?.restoreModalState, onOpenModal]);

  return {
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
  };
}
