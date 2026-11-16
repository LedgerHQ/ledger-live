import type { ResolvedInstrument } from "@ledgerhq/live-common/families/canton/proposalSorting";
import type { TransferInstructionType } from "@ledgerhq/live-common/families/canton/react";
import BigNumber from "bignumber.js";
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

// An unknown instrument's amount is coded with the "Unknown token" label, so it carries the warning.
export const amountColor = ({
  isIncoming,
  isUnknownInstrument,
}: Pick<ProcessedProposal, "isIncoming" | "isUnknownInstrument">): string | undefined => {
  if (isUnknownInstrument) return "warning.c70";
  return isIncoming ? undefined : "neutral.c80";
};

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const processTransferProposals = (
  proposals: RawTransferProposal[],
  accountXpub: string,
  resolveInstrument: (instrumentId: string, instrumentAdmin: string) => ResolvedInstrument,
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
    const { unit, isUnknown } = resolveInstrument(
      proposal.instrument_id,
      proposal.instrument_admin,
    );

    const processed: ProcessedProposal = {
      contractId: proposal.contract_id,
      sender: proposal.sender,
      receiver: proposal.receiver,
      amount: new BigNumber(proposal.amount),
      instrumentId: proposal.instrument_id,
      instrumentAdmin: proposal.instrument_admin,
      unit,
      isUnknownInstrument: isUnknown,
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
