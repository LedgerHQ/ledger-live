export type APIAccount =
  | {
      type: "empty";
      address: string;
      counter: number;
    }
  | {
      type: "user";
      address: string;
      publicKey: string;
      revealed: boolean;
      balance: number;
      counter: number;
      delegate?: {
        alias: string;
        address: string;
        active: boolean;
      };
      delegationLevel: number;
      delegationTime: string;
      numTransactions: number;
      firstActivityTime: string;
    };

type CommonOperationType = {
  id: number;
  hash?: string;
  storageFee?: number;
  allocationFee?: number;
  bakerFee?: number;
  timestamp: string;
  level: number;
  block: string;
  gasLimit?: number;
  storageLimit?: number;
  status?: "applied" | "failed" | "backtracked" | "skipped";
};

/**
 * Source: https://api.tzkt.io/#operation/Accounts_GetOperations
 */
export type APITransactionType = CommonOperationType & {
  type: "transaction";
  amount: number;
  initiator: { address: string } | undefined | null;
  sender: { address: string } | undefined | null;
  target: { address: string } | undefined | null;
  counter: number;
};
export function isAPITransactionType(op: APIOperation): op is APITransactionType {
  return op.type === "transaction";
}
export type APIDelegationType = CommonOperationType & {
  type: "delegation";
  amount: number;
  sender: { address: string } | undefined | null;
  counter: number;
  prevDelegate: { address: string } | undefined | null;
  newDelegate: { address: string } | undefined | null;
};
export function isAPIDelegationType(op: APIOperation): op is APIDelegationType {
  return op.type === "delegation";
}

// https://api.tzkt.io/#operation/Accounts_GetOperations
export type AccountsGetOperationsOptions = {
  lastId?: number; // used as a pagination cursor to fetch more transactions
  limit?: number;
  sort?: "Descending" | "Ascending";
  // the minimum height of the block the operation is in
  "level.ge": number;
};

export type APIOperation =
  | APITransactionType
  | (CommonOperationType & {
      type: "reveal";
    })
  | APIDelegationType
  | (CommonOperationType & {
      type: "activation";
      balance: number;
    })
  | (CommonOperationType & {
      type: "origination";
      contractBalance: number;
      originatedContract: {
        address: string;
      };
    })
  | (CommonOperationType & {
      type: "migration";
      balanceChange: number;
    })
  | (CommonOperationType & {
      type: ""; // this is to express fact we have others and we need to always filter out others
    });

export type APIBlock = {
  cycle: number;
  level: number;
  hash: string;
  timestamp: string;
  proto: number;
  payloadRound: number;
  blockRound: number;
  validations: number;
  deposit: number;
  rewardDelegated: number;
  rewardStakedOwn: number;
  rewardStakedEdge: number;
  rewardStakedShared: number;
  bonusDelegated: number;
  bonusStakedOwn: number;
  bonusStakedEdge: number;
  bonusStakedShared: number;
  fees: number;
  nonceRevealed: boolean;
  proposer: {
    address: string;
  };
  producer: {
    address: string;
  };
  software: {
    date: string;
  };
  lbToggle: boolean;
  lbToggleEma: number;
  aiToggleEma: number;
  rewardLiquid: number;
  bonusLiquid: number;
  reward: number;
  bonus: number;
  priority: number;
  baker: {
    address: string;
  };
  lbEscapeVote: boolean;
  lbEscapeEma: number;
};
