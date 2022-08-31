import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export type CeloOperationMode =
  | "send"
  | "lock"
  | "unlock"
  | "withdraw"
  | "vote"
  | "revoke"
  | "activate"
  | "register";

export type CeloVoteType = "pending" | "active";
export type CeloVoteStatus = CeloVoteType | "awaitingActivation";

export type CeloPendingWithdrawal = {
  value: BigNumber;
  time: BigNumber;
  index: number;
};
export type CeloPendingWithdrawalRaw = {
  value: string;
  time: string;
  index: string;
};
export type CeloResources = {
  registrationStatus: boolean;
  lockedBalance: BigNumber;
  nonvotingLockedBalance: BigNumber;
  pendingWithdrawals: CeloPendingWithdrawal[] | null | undefined;
  votes: CeloVote[] | null | undefined;
  electionAddress: string | null | undefined;
  lockedGoldAddress: string | null | undefined;
  maxNumGroupsVotedFor: BigNumber;
};
export type CeloResourcesRaw = {
  registrationStatus: boolean;
  lockedBalance: string;
  nonvotingLockedBalance: string;
  pendingWithdrawals: CeloPendingWithdrawalRaw[] | null | undefined;
  votes: CeloVoteRaw[] | null | undefined;
  electionAddress: string | null | undefined;
  lockedGoldAddress: string | null | undefined;
  maxNumGroupsVotedFor: string;
};
export type Transaction = TransactionCommon & {
  family: "celo";
  fees: BigNumber | null | undefined;
  mode: CeloOperationMode;
  index: number | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "celo";
  fees: string | null | undefined;
  mode: CeloOperationMode;
  index: number | null | undefined;
};
export type CeloValidatorGroup = {
  address: string;
  name: string;
  votes: BigNumber;
};
export type CeloVote = {
  validatorGroup: string;
  amount: BigNumber;
  activatable: boolean;
  revokable: boolean;
  type: CeloVoteType;
  index: number;
};
export type CeloVoteRaw = {
  validatorGroup: string;
  amount: string;
  activatable: boolean;
  revokable: boolean;
  type: CeloVoteType;
  index: number;
};
export type FigmentIndexerTransaction = {
  id: number;
  height: number;
  time: string;
  transaction_hash: string;
  address: string;
  amount: number;
  kind: string;
  data?: {
    Raw?: {
      data: string;
      topics: Array<string>;
      address: string;
      removed: boolean;
      logIndex: string;
      blockHash: string;
      blockNumber: string;
      transactionHash: string;
      transactionIndex: string;
    };
    gas: number;
    Account?: string;
    Group?: string;
    success?: boolean;
    from?: string;
    to?: string;
    gas_used: number;
    gas_price: number;
  };
};

export type CeloPreloadData = {
  validatorGroups: CeloValidatorGroup[];
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type CeloAccount = Account & { celoResources: CeloResources };

export type CeloAccountRaw = AccountRaw & { celoResources: CeloResourcesRaw };

export type PendingStakingOperationAmounts = {
  vote: BigNumber;
  lock: BigNumber;
};
