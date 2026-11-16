import type { Unit } from "@domain/entity-currency-unit";
import BigNumber from "bignumber.js";

export type TransferProposalAction = "accept" | "reject" | "withdraw";

export type Modal = {
  isOpen: boolean;
  action: TransferProposalAction;
  contractId: string;
};

export type RawTransferProposal = {
  contract_id: string;
  sender: string;
  receiver: string;
  amount: string;
  instrument_id: string;
  instrument_admin: string;
  memo?: string;
  expires_at_micros: number;
  update_id?: string;
};

export type ProcessedProposal = {
  contractId: string;
  sender: string;
  receiver: string;
  amount: BigNumber;
  instrumentId: string;
  instrumentAdmin: string;
  // Unit resolved per instrument (id and admin) so token offers render with the token's
  // ticker / magnitude even when shown on the parent (native) account.
  unit: Unit;
  // Neither native CC nor a CAL token: another admin's instrument, or one CAL doesn't list.
  isUnknownInstrument: boolean;
  memo: string;
  expiresAtMicros: number;
  isExpired: boolean;
  isIncoming: boolean;
  expiresAt: Date;
  day: Date;
};

export type GroupedProposals = Array<{
  day: Date;
  proposals: ProcessedProposal[];
}>;
