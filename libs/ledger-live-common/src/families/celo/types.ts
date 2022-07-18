import { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

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
};
export type CeloResourcesRaw = {
  registrationStatus: boolean;
  lockedBalance: string;
  nonvotingLockedBalance: string;
  pendingWithdrawals: CeloPendingWithdrawalRaw[] | null | undefined;
  votes: CeloVoteRaw[] | null | undefined;
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
export type CeloPreloadData = {
  validatorGroups: CeloValidatorGroup[];
};
