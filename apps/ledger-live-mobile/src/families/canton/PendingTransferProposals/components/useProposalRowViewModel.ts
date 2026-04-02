import { useTimeRemaining } from "@ledgerhq/live-common/families/canton/react";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import { useCallback } from "react";
import { hoursAndMinutesOptionsSelector } from "~/components/DateFormat/FormatDate";
import { useSelector } from "~/context/hooks";
import type { ProcessedProposal, TransferProposalAction } from "../types";

export type ProposalRowProps = {
  proposal: ProcessedProposal;
  account: Account;
  unit: Unit;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

type Input = {
  proposal: ProcessedProposal;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

export type ProposalRowViewModel = {
  timeRemaining: string;
  formattedTime: string;
  addressToShow: string;
  amountValue: BigNumber;
  amountColor: string;
  handleRowPress: () => void;
  handleWithdrawPress: () => void;
};

export function useProposalRowViewModel({
  proposal,
  onRowClick,
  onOpenModal,
}: Input): ProposalRowViewModel {
  const { isIncoming, isExpired, contractId, sender, receiver, amount, expiresAt } = proposal;

  const timeRemaining = useTimeRemaining(proposal.expiresAtMicros, isExpired);
  const hoursAndMinutesOptions = useSelector(hoursAndMinutesOptionsSelector);

  const addressToShow = isIncoming ? sender : receiver;
  const amountValue = isIncoming ? amount : amount.negated();
  const amountColor = isIncoming ? "success.c50" : "error.c50";
  const formattedTime = hoursAndMinutesOptions.format(expiresAt);

  const handleRowPress = useCallback(() => {
    onRowClick(contractId);
  }, [onRowClick, contractId]);

  const handleWithdrawPress = useCallback(() => {
    onOpenModal(contractId, "withdraw");
  }, [onOpenModal, contractId]);

  return {
    timeRemaining,
    formattedTime,
    addressToShow,
    amountValue,
    amountColor,
    handleRowPress,
    handleWithdrawPress,
  };
}
