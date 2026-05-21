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
      stakedBalance?: number;
      unstakedBalance?: number;
      stakingUpdatesCount?: number;
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

export type APIRevealType = CommonOperationType & {
  type: "reveal";
  sender: { address: string } | undefined | null;
  counter: number;
};
export function isAPIRevealType(op: APIOperation): op is APIRevealType {
  return op.type === "reveal";
}

export type APIStakingType = Omit<CommonOperationType, "block"> & {
  type: "staking";
  action: "stake" | "unstake" | "finalize";
  /** Present on succeeded ops; failed ops omit `amount` and only carry `requestedAmount`. */
  amount?: number;
  requestedAmount?: number;
  counter: number;
  sender: { address: string } | undefined | null;
  staker?: { address: string } | undefined | null;
  baker?: { address: string; alias?: string } | undefined | null;
  stakingUpdatesCount?: number;
  /**
   * `/accounts/{addr}/operations` returns the full block object inline
   * (with `.hash` and other fields); `/operations/staking` returns the
   * hash as a plain string. Consumers must narrow before reading `.hash`.
   */
  block?: string | APIBlock;
};
export function isAPIStakingType(op: APIOperation): op is APIStakingType {
  return op.type === "staking";
}

// https://api.tzkt.io/#operation/Accounts_GetOperations
export type AccountsGetOperationsOptions = {
  lastId?: number; // used as a pagination cursor to fetch more transactions
  limit?: number;
  sort?: "Descending" | "Ascending";
  // the minimum height of the block the operation is in
  "level.ge": number;
  /** Exclusive upper bound on block level (pagination window). */
  "level.lt"?: number;
  /** Exclusive lower bound on block level (pagination window). */
  "level.gt"?: number;
};

export type APIOperation =
  | APITransactionType
  | APIRevealType
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
  | APIStakingType
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
  /** Hash of the previous block. Not included by default; request via TzKT `select` param if needed. */
  prevHash?: string;
};

export type TokenTransfersGetOptions = {
  limit?: number;
  sort?: "Descending" | "Ascending";
  "level.ge"?: number;
  "level.lt"?: number;
  "level.gt"?: number;
  /** Exclusive upper bound on transfer id (TzKT `id.lt`). Used for intra-level pagination when sort is Descending. */
  "id.lt"?: number;
  /** Exclusive lower bound on transfer id (TzKT `id.gt`). Used for intra-level pagination when sort is Ascending. */
  "id.gt"?: number;
};

/**
 * A FA1.2 / FA2 token transfer event returned by `GET /v1/tokens/transfers`.
 * https://api.tzkt.io/#operation/Tokens_GetTokenTransfers
 */
export type APITokenTransfer = {
  /** Unique transfer identifier (monotonically increasing, usable as cursor). */
  id: number;
  level: number;
  timestamp: string;
  token: {
    id: number;
    contract: { address: string };
    /** Stringified token ID (FA2 only; "0" for FA1.2). */
    tokenId: string;
    standard: "fa1.2" | "fa2";
    metadata?: {
      name?: string;
      symbol?: string;
      decimals?: string;
    };
  };
  /** Sender address. Null/undefined for minting events. */
  from: { address: string } | undefined | null;
  /** Receiver address. Null/undefined for burning events. */
  to: { address: string } | undefined | null;
  /** Transfer amount as a decimal string (integer, no magnitude applied). */
  amount: string;
  /**
   * The `id` of the `APITransactionType` operation that triggered this transfer.
   * Use this to join token transfers back to their parent on-chain operation hash.
   * Undefined for implicit/protocol-level transfers.
   */
  transactionId?: number;
  originationId?: number;
};

/**
 * A FA1.2 / FA2 token balance event returned by `GET /v1/tokens/balances`.
 * https://api.tzkt.io/#operation/Tokens_GetTokenBalances
 */
export type APITokenBalance = {
  id: number;
  account: {
    address: string;
  };
  token: {
    id: number;
    contract: { address: string; alias?: string };
    tokenId: string;
    standard: "fa1.2" | "fa2";
    metadata?: {
      name?: string;
      symbol: string;
      decimals: string;
    };
  };
  balance: string;
  transfersCount: number;
  firstLevel: number;
  firstTime: string;
  lastLevel: number;
  lastTime: string;
};
