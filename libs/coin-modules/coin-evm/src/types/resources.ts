import BigNumber from "bignumber.js";

export type EvmResources = CeloResources | undefined;
export type EvmResourcesRaw = CeloResourcesRaw | undefined;

export type CeloVote = {
  validatorGroup: string;
  amount: BigNumber;
  activatable: boolean;
  revokable: boolean;
  type: "pending" | "active" | "awaitingActivation";
  index: number;
};
export type CeloVoteRaw = {
  validatorGroup: string;
  amount: string;
  activatable: boolean;
  revokable: boolean;
  type: "pending" | "active" | "awaitingActivation";
  index: number;
};

export type CeloPendingWithdrawal = {
  value: BigNumber;
  time: BigNumber;
  index: number;
};
export type CeloPendingWithdrawalRaw = {
  value: string;
  time: string;
  index: number;
};

export type CeloResources = {
  type: "celo_evm";
  registrationStatus: boolean;
  lockedBalance: BigNumber;
  nonvotingLockedBalance: BigNumber;
  pendingWithdrawals: CeloPendingWithdrawal[] | null | undefined;
  votes: CeloVote[] | null | undefined;
  maxNumGroupsVotedFor: BigNumber;
};
export type CeloResourcesRaw = {
  type: "celo_evm";
  registrationStatus: boolean;
  lockedBalance: string;
  nonvotingLockedBalance: string;
  pendingWithdrawals: CeloPendingWithdrawalRaw[] | null | undefined;
  votes: CeloVoteRaw[] | null | undefined;
  maxNumGroupsVotedFor: string;
};
