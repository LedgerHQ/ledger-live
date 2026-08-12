import type { BlockchainFamily, ChainId, JobStateBase, Proof } from "../types";

export type RenameLedgerAccountIntentInput = {
  previousAccountName: string;
  newAccountName: string;
  derivationPath: string;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  hmacProof: Proof;
};

export type RenameLedgerAccountResult = {
  previousAccountName: string;
  accountName: string;
  derivationPath: string;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  hmacProof: Proof;
};

export type RenameLedgerAccountJobState =
  | JobStateBase
  | {
      type: "completed";
      result: RenameLedgerAccountResult;
    };
