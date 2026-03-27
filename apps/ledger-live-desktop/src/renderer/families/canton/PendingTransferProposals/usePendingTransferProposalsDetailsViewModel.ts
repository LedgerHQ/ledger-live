import { useTimeRemaining } from "@ledgerhq/live-common/families/canton/react";
import { Account } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { dayFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import type { ProcessedProposal, TransferProposalAction } from "./types";

type Input = {
  account: Account;
  proposal: ProcessedProposal | null;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
  onClose?: () => void;
};

export type PendingTransferProposalsDetailsViewModel = {
  proposal: ProcessedProposal | null;
  unit: ReturnType<typeof useAccountUnit>;
  dateFormatted: string;
  timeRemaining: string;
  handleAction: (action: TransferProposalAction) => void;
};

export function usePendingTransferProposalsDetailsViewModel({
  account,
  proposal,
  onOpenModal,
  onClose,
}: Input): PendingTransferProposalsDetailsViewModel {
  const unit = useAccountUnit(account);

  const formatDate = useDateFormatter(dayFormat);
  const dateFormatted = useMemo(
    () => formatDate(new Date((proposal?.expiresAtMicros ?? 0) / 1000)),
    [proposal?.expiresAtMicros, formatDate],
  );
  const timeRemaining = useTimeRemaining(proposal?.expiresAtMicros, proposal?.isExpired);

  const handleAction = useCallback(
    (action: TransferProposalAction) => {
      if (proposal) {
        onOpenModal(proposal.contractId, action);
        onClose?.();
      }
    },
    [onClose, onOpenModal, proposal],
  );

  return {
    proposal,
    unit,
    dateFormatted,
    timeRemaining,
    handleAction,
  };
}
