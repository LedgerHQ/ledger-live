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

export type APIRevealType = CommonOperationType & {
  type: "reveal";
  sender: { address: string } | undefined | null;
  counter: number;
};
export function isAPIRevealType(op: APIOperation): op is APIRevealType {
  return op.type === "reveal";
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
  /** Hash of the previous block. Not included by default; request via TzKT `select` param if needed. */
  prevHash?: string;
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
  balanceValue: string | null;
  transfersCount: number;
  firstLevel: number;
  firstTime: string;
  lastLevel: number;
  lastTime: string;
};
