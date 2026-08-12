import type { BlockchainFamily, ChainId, JobStateBase, Proof } from "../types";

export type RegisterLedgerAccountIntentInput = {
  accountName: string;
  derivationPath: string;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
};

export type RegisterLedgerAccountResult = {
  accountName: string;
  derivationPath: string;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  hmacProof: Proof;
};

export type RegisterLedgerAccountJobState =
  | JobStateBase
  | {
      type: "completed";
      result: RegisterLedgerAccountResult;
    };
