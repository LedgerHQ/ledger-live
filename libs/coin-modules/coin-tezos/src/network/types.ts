/**
 * Fields common to tzkt account types that own a manager key (`user` and `delegate`):
 * both publish a public key on-chain and therefore carry a reveal state, counter,
 * balance, and (un)staked balances.
 * See https://api.tzkt.io/#operation/Accounts_GetByAddress (schemas `User` / `Delegate`).
 */
type APIManagerAccountBase = {
  address: string;
  publicKey: string;
  revealed: boolean;
  balance: number;
  stakedBalance?: number;
  unstakedBalance?: number;
  stakingUpdatesCount?: number;
  counter: number;
  /**
   * The baker this account delegates to, if any. Present on plain wallets that have set a
   * delegate. We do not rely on it for registered bakers: a `delegate` account is its own
   * baker (self-delegated), and staking logic keys off `type === "delegate"` rather than this
   * field, so it's fine whether or not tzkt populates it.
   */
  delegate?: {
    alias: string;
    address: string;
    active: boolean;
  };
};

/**
 * tzkt's `/v1/accounts/{address}` returns a discriminated union on `type` with seven
 * variants: `user`, `delegate`, `contract`, `ghost`, `empty`, `rollup`, `smart_rollup`.
 * We model only the ones we consume: `empty` (never appeared on-chain) plus the two
 * manager-key variants, `user` (plain wallet) and `delegate` (registered baker). A baker
 * is reported as `type: "delegate"`, NOT `"user"` — so any manager-key logic must accept
 * both (see {@link hasManagerKey}).
 */
export type APIAccount =
  | {
      type: "empty";
      address: string;
      counter: number;
    }
  | (APIManagerAccountBase & {
      type: "user";
      delegationLevel: number;
      delegationTime: string;
      numTransactions: number;
      firstActivityTime: string;
    })
  | (APIManagerAccountBase & {
      // A registered baker. tzkt reports these with `type: "delegate"` (not `"user"`),
      // still carrying `revealed`/`publicKey`/`counter`. In practice a delegate is revealed
      // (registration is a manager operation, which requires a prior reveal), but we still
      // read `revealed` from the payload rather than assuming it.
      type: "delegate";
    });

/** tzkt account variants that own a manager key — both `user` and `delegate` qualify. */
export type APIManagerAccount = Extract<APIAccount, { type: "user" | "delegate" }>;

/**
 * True for accounts that have published a public key on-chain and therefore carry
 * `revealed`, `publicKey`, `counter`, and `balance`: plain wallets (`user`) and
 * registered bakers (`delegate`). `empty` accounts (and the non-manager `contract` /
 * `ghost` / `rollup` types we don't model) do not qualify. Use this instead of a bare
 * `type === "user"` check so baker accounts aren't mistaken for empty/unrevealed ones.
 */
export function hasManagerKey(account: APIAccount): account is APIManagerAccount {
  return account.type === "user" || account.type === "delegate";
}

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

export type APIOriginationType = CommonOperationType & {
  type: "origination";
  sender: { address: string } | undefined | null;
  counter: number;
  contractBalance: number;
  originatedContract?: {
    address: string;
  };
};
export function isAPIOriginationType(op: APIOperation): op is APIOriginationType {
  return op.type === "origination";
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
  | APIOriginationType
  | (CommonOperationType & {
      type: "migration";
      balanceChange: number;
    })
  | APIStakingType
  | (CommonOperationType & {
      type: ""; // this is to express fact we have others and we need to always filter out others
    });

/**
 * Unstake request as returned by https://api.tzkt.io/#operation/Staking_GetUnstakeRequests.
 * `firstTime`: ISO timestamp the request was opened; the 4-day unlock window starts here.
 */
export type APIUnstakeRequest = {
  id: number;
  cycle: number;
  baker: { address: string; alias?: string };
  staker: { address: string };
  firstTime: string;
  status: "pending" | "finalizable" | "finalized";
  /** Net amount actually returnable (mutez), accounting for slashing/rounding. */
  actualAmount: number;
  requestedAmount?: number;
};

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
