import { useTimeRemaining } from "@ledgerhq/live-common/families/canton/react";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import Clipboard from "@react-native-clipboard/clipboard";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useCallback } from "react";
import { type ProcessedProposal, type TransferProposalAction } from "./types";

type Input = {
  account: Account;
  proposal: ProcessedProposal | null;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

export type PendingTransferProposalsDetailsViewModel = {
  unit: Unit;
  timeRemaining: string;
  handleAction: (action: TransferProposalAction) => void;
  handleCopy: (text: string) => void;
};

export function usePendingTransferProposalsDetailsViewModel({
  account,
  proposal,
  onOpenModal,
}: Input): PendingTransferProposalsDetailsViewModel {
  const unit = useAccountUnit(account);
  const timeRemaining = useTimeRemaining(proposal?.expiresAtMicros, proposal?.isExpired);

  const handleAction = useCallback(
    (action: TransferProposalAction) => {
      if (proposal) onOpenModal(proposal.contractId, action);
    },
    [onOpenModal, proposal],
  );

  const handleCopy = useCallback((text: string) => {
    Clipboard.setString(text);
  }, []);

  return {
    unit,
    timeRemaining,
    handleAction,
    handleCopy,
  };
}
