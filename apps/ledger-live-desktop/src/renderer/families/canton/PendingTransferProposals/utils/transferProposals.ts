import type { TransferInstructionType } from "@ledgerhq/live-common/families/canton/react";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import type {
  GroupedProposals,
  ProcessedProposal,
  RawTransferProposal,
  TransferProposalAction,
} from "../types";

export const INSTRUCTION_TYPE_MAP: Record<TransferProposalAction, TransferInstructionType> = {
  accept: "accept-transfer-instruction",
  reject: "reject-transfer-instruction",
  withdraw: "withdraw-transfer-instruction",
};

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const processTransferProposals = (
  proposals: RawTransferProposal[],
  accountXpub: string,
  getUnit: (instrumentId: string) => Unit,
): { incoming: ProcessedProposal[]; outgoing: ProcessedProposal[] } => {
  const currentTime = Date.now();
  const incoming: ProcessedProposal[] = [];
  const outgoing: ProcessedProposal[] = [];

  // Iterate in reverse so the most-recently-added proposal appears first
  // within each day group after groupByDay sorts descending.
  for (let i = proposals.length - 1; i >= 0; i--) {
    const proposal = proposals[i];
    const expiresAtMs = proposal.expires_at_micros / 1000;
    const expiresAt = new Date(expiresAtMs);
    const isExpired = currentTime > expiresAtMs;
    const isIncoming = proposal.sender !== accountXpub;

    const processed: ProcessedProposal = {
      contractId: proposal.contract_id,
      sender: proposal.sender,
      receiver: proposal.receiver,
      amount: new BigNumber(proposal.amount),
      instrumentId: proposal.instrument_id,
      unit: getUnit(proposal.instrument_id),
      memo: proposal.memo ?? "",
      expiresAtMicros: proposal.expires_at_micros,
      isExpired,
      isIncoming,
      expiresAt,
      day: startOfDay(expiresAt),
    };

    if (isIncoming) {
      incoming.push(processed);
    } else {
      outgoing.push(processed);
    }
  }

  return { incoming, outgoing };
};

export const groupByDay = (proposals: ProcessedProposal[]): GroupedProposals => {
  if (proposals.length === 0) {
    return [];
  }

  const grouped = new Map<number, ProcessedProposal[]>();

  for (const proposal of proposals) {
    const dayTimestamp = proposal.day.getTime();
    const existing = grouped.get(dayTimestamp);
    if (existing) {
      existing.push(proposal);
    } else {
      grouped.set(dayTimestamp, [proposal]);
    }
  }

  return Array.from(grouped.entries())
    .sort(([timestampA], [timestampB]) => timestampB - timestampA)
    .map(([dayTimestamp, groupedProposals]) => ({
      day: new Date(dayTimestamp),
      proposals: groupedProposals,
    }));
};
