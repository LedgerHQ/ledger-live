import type { AccountLike } from "@ledgerhq/types-live";
import type { ConfidentialBalance, PreparedConfidentialTx } from "@ledgerhq/coin-evm/confidential";

// The private part of an ERC-20 lives in the host app: it holds the Zama client and the balances the
// user revealed in the session, none of which the account carries. The host mirrors them here, the way
// it mirrors `setZcashShieldedEnabled`, so the EVM descriptor and bridge can offer a confidential
// source without importing app code.

type PrepareParams = {
  sender: string;
  recipient: string;
  underlying: string;
  amount: bigint;
  balance: ConfidentialBalance;
};

export type ConfidentialSendRuntime = {
  /** The last private balance the host read for this token account, if any. */
  getBalance: (tokenAccountId: string) => ConfidentialBalance | undefined;
  /** The address that owns the token account's private part, once the host has read it. */
  getOwner: (tokenAccountId: string) => string | undefined;
  /** Prepares a confidential transfer: coin-evm `prepareConfidentialSend` with the host's client. */
  prepareSend: (currencyId: string, p: PrepareParams) => Promise<PreparedConfidentialTx>;
  /**
   * Prepares a shield: coin-evm `prepareShield` with the host's client. `approve` is null when the
   * allowance already covers the amount; `wrap` is pinned to the nonce after approve's.
   */
  prepareShield: (
    currencyId: string,
    p: { sender: string; underlying: string; amount: bigint },
  ) => Promise<{
    transactions: [approve: { transaction: string } | null, wrap: { transaction: string }];
    amountPulled: bigint;
    remainder: bigint;
  }>;
  /** Prepares phase 1 of an unshield: coin-evm `prepareUnshield` with the host's client. */
  prepareUnshield: (currencyId: string, p: PrepareParams) => Promise<PreparedConfidentialTx>;
  /**
   * A phase-1 unshield was signed: the host follows it until it can be finalized. `amount` is in
   * wrapper units, as `PendingUnshield.amount`.
   */
  onUnshieldRequested: (
    tokenAccountId: string,
    request: { requestTxHash: string; amount: bigint },
  ) => void;
};

let runtime: ConfidentialSendRuntime | undefined;

/** Set by the host app once it can serve confidential balances; `undefined` turns the source off. */
export const setConfidentialSendRuntime = (value: ConfidentialSendRuntime | undefined): void => {
  runtime = value;
};

export const getConfidentialSendRuntime = (): ConfidentialSendRuntime | undefined => runtime;

type SpendableBalance = Exclude<ConfidentialBalance, { state: "undisclosed" }>;

/**
 * Whether the host knows this token account has a confidential wrapper: its private part has been
 * read, revealed or not. Only then can it be shielded into.
 */
export function hasConfidentialPart(account: AccountLike): boolean {
  return account.type === "TokenAccount" && runtime?.getBalance(account.id) !== undefined;
}

/**
 * The private balance a send may draw from: a decrypted value, current or stale. An undisclosed
 * balance has no value at all, so it offers no confidential source.
 */
export function getSpendableConfidentialBalance(
  account: AccountLike,
): SpendableBalance | undefined {
  if (account.type !== "TokenAccount") return undefined;
  const balance = runtime?.getBalance(account.id);
  return balance && balance.state !== "undisclosed" ? balance : undefined;
}
