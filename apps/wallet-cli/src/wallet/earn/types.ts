/**
 * Shared, serializable result/row shapes for the `earn` command surface.
 *
 * These types are deliberately family-agnostic so the ETH (eth-vault-pipeline.ts) and SOL
 * (sol-stake.ts) implementations can both produce them, and so output.ts can render them without
 * importing any pipeline. Keep everything JSON-serializable (no BigNumber/Date/observables).
 */

/** One row in `earn yields`. Combines a /v0/grow entry with optional provider enrichment. */
export type EarnYieldRow = {
  /** Network string, e.g. "ethereum", "solana". From /v0/grow `network`. */
  network: string;
  /** Provider display name, e.g. "Kiln", "P2P". */
  provider: string;
  /** Currency/token id deposited to earn yield. From /v0/grow `deposit_token`. */
  depositToken: string;
  /** Interest type as reported by the backend, e.g. "APY" | "NRR". */
  interestType: string;
  /** Interest value as a decimal string (rate, not percent), e.g. "0.0569". */
  interestValue: string;
  /** Provider id (from /v0/currency/{id}/providers), present only when enriched via --network. */
  providerId?: string;
  /** Provider category, e.g. "liquid" | "pooling" | "protocol" | "restaking". */
  category?: string;
  /** APY as a percentage number, when provided by /v0/currency/{id}/providers. */
  apy?: number;
  /** Minimum deposit (provider units), when known. */
  min?: number;
  /** Wallet-API app id backing this provider, when known. */
  liveAppId?: string;
  /**
   * `ledgerlive://` deeplink that opens this provider's live app in Ledger Live. Present only on
   * provider rows (those backed by a `liveAppId`): the CLI cannot run a live app, so it surfaces the
   * deeplink for the user to open in the wallet instead. Account-specific params (e.g. accountId) are
   * added by the app at open time, not here.
   */
  deeplink?: string;
  /**
   * ETH vault id (from /v1/defi/products). This is the value to pass to `earn deposit --product`
   * for an EVM vault. Present only on deposit-product rows surfaced via `--network ethereum`.
   */
  vaultId?: string;
  /**
   * Solana validator vote account address (from the Ledger validators list). This is the value to
   * pass to `earn deposit --product` for Solana staking. Present only on validator rows surfaced
   * via `--network solana`.
   */
  validator?: string;
  /** Human label for the deposit product (vault display name or validator name). */
  productName?: string;
  /** Validator commission percentage (Solana validator rows only). */
  commission?: number;
  /**
   * True when this row is a concrete `earn deposit --product` target (ETH vault id / SOL validator
   * vote account). Grow/provider rows are informational and leave this unset — they cannot be passed
   * to `earn deposit`.
   */
  depositable?: boolean;
};

/**
 * One on-chain Solana stake account, derived from the synced account's `solanaResources.stakes`.
 * `stakeAccount` is the value `earn withdraw --stake-account` expects.
 */
export type EarnSolanaStake = {
  /** Stake account address — the `earn withdraw --stake-account` value. */
  stakeAccount: string;
  /** Validator vote account this stake is delegated to, when delegated. */
  validator?: string;
  /** Activation state: undelegate is allowed while "active"; withdraw once "inactive". */
  state: "active" | "inactive" | "activating" | "deactivating";
  /** Total lamports held by the stake account. */
  stakeBalance: number;
  /** Lamports currently withdrawable back to the main account. */
  withdrawable: number;
};

/**
 * One row in `earn positions`. Wraps a raw BatchedView (one backend stake view) with the resolved
 * account context. On-chain Solana stake accounts are NOT carried here: they belong to the account,
 * not to an individual view, so they are passed alongside the rows (see `earnPositions`).
 */
export type EarnPositionRow = {
  /** Network string passed to /v1/stakes, e.g. "solana". */
  network: string;
  /** On-chain address the positions belong to. */
  address: string;
  /** Whether a fresh (uncached) read was requested. */
  fresh?: boolean;
  /** Whether the backend flagged the data as stale (v3 only). */
  isStale?: boolean;
  /** Raw BatchedView payload from the backend (shape is backend-defined / permissive). */
  data: Record<string, unknown>;
};

/** A single broadcast (or dry-run) transaction produced by a deposit/withdraw flow. */
export type EarnTransaction = {
  /**
   * Logical step this transaction represents, e.g.
   *   ETH: "approve" | "deposit" | "redeem"
   *   SOL: "stake.createAccount" | "stake.delegate" | "stake.undelegate" | "stake.withdraw"
   */
  kind: string;
  /** Broadcast transaction hash, when available. */
  hash?: string;
  /** Recipient / contract the transaction targets, when relevant. */
  to?: string;
  /** Human-readable amount for this step, when relevant. */
  amount?: string;
  /** Per-transaction status, when the flow polls it (e.g. ETH tx status). */
  status?: string;
};

/** Result of `earn deposit`, produced by depositEvm/depositSolana. */
export type EarnDepositResult = {
  /** Currency family that handled the deposit, e.g. "evm" | "solana". */
  family: string;
  /** Resolved account id/descriptor id. */
  account: string;
  /** Network string, e.g. "ethereum:main" | "solana:main". */
  network: string;
  /** Human amount requested by the user. */
  amount: string;
  /** Vault id (ETH) or validator vote address (SOL) the user targeted. */
  product?: string;
  /** Validator address, when applicable (SOL). */
  validator?: string;
  /** Stake account address, when applicable (SOL). */
  stakeAccount?: string;
  /** True when --dry-run was set (no signing/broadcast). */
  dryRun: boolean;
  /** Overall flow status, e.g. "broadcasted" | "dry-run" | "pending". */
  status: string;
  /** Ordered list of on-chain steps performed (approve→deposit, create→delegate, …). */
  transactions: EarnTransaction[];
};

/** Result of `earn withdraw`, produced by withdrawEvm/withdrawSolana. */
export type EarnWithdrawResult = {
  /** Currency family that handled the withdrawal, e.g. "evm" | "solana". */
  family: string;
  /** Resolved account id/descriptor id. */
  account: string;
  /** Network string, e.g. "ethereum:main" | "solana:main". */
  network: string;
  /** Human amount requested, when applicable (omitted for full/finalize withdrawals). */
  amount?: string;
  /** Vault id (ETH) the user targeted. */
  product?: string;
  /** Stake account address (SOL) the user targeted. */
  stakeAccount?: string;
  /** True when the second phase (SOL stake.withdraw) was requested via --finalize. */
  finalize?: boolean;
  /** True when --dry-run was set (no signing/broadcast). */
  dryRun: boolean;
  /** Overall flow status, e.g. "broadcasted" | "dry-run" | "pending". */
  status: string;
  /** Ordered list of on-chain steps performed (redeem, undelegate, withdraw, …). */
  transactions: EarnTransaction[];
};
