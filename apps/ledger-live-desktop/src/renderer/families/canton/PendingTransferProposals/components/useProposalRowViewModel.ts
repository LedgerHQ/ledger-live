import type { Unit } from "@ledgerhq/types-cryptoassets";
import { useTimeRemaining } from "@ledgerhq/live-common/families/canton/react";
import { BigNumber } from "bignumber.js";
import { useCallback } from "react";
import type { ProcessedProposal, TransferProposalAction } from "../types";

export type ProposalRowProps = {
  proposal: ProcessedProposal;
  unit: Unit;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

export type ProposalRowViewModel = {
  proposal: ProcessedProposal;
  unit: Unit;
  timeRemaining: string;
  addressToShow: string;
  amountValue: BigNumber;
  handleAcceptClick: (e: React.MouseEvent) => void;
  handleRejectClick: (e: React.MouseEvent) => void;
  handleWithdrawClick: (e: React.MouseEvent) => void;
  handleRowClick: () => void;
};

export function useProposalRowViewModel({
  proposal,
  unit,
  onRowClick,
  onOpenModal,
}: ProposalRowProps): ProposalRowViewModel {
  const { isIncoming, isExpired, contractId, sender, receiver, amount } = proposal;

  const timeRemaining = useTimeRemaining(proposal.expiresAtMicros, isExpired);

  const addressToShow = isIncoming ? sender : receiver;
  const amountValue = isIncoming ? amount : amount.negated();

  const handleRowClick = useCallback(() => {
    onRowClick(contractId);
  }, [onRowClick, contractId]);

  const handleAcceptClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isExpired) {
        onOpenModal(contractId, "accept");
      }
    },
    [contractId, isExpired, onOpenModal],
  );

  const handleRejectClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenModal(contractId, "reject");
    },
    [contractId, onOpenModal],
  );

  const handleWithdrawClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenModal(contractId, "withdraw");
    },
    [contractId, onOpenModal],
  );

  return {
    proposal,
    unit,
    timeRemaining,
    addressToShow,
    amountValue,
    handleAcceptClick,
    handleRejectClick,
    handleWithdrawClick,
    handleRowClick,
  };
}
