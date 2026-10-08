import type { AccountLike } from "@ledgerhq/types-live";
import type { ConfidentialBalance, PreparedConfidentialTx } from "@ledgerhq/coin-evm/confidential";

// The private part of an ERC-20 lives in the host app: it holds the Zama client and the balances the
// user revealed in the session, none of which the account carries. The host mirrors them here, the way
// it mirrors `setZcashShieldedEnabled`, so the EVM descriptor and bridge can offer a confidential
// source without importing app code.

export type ConfidentialSendRuntime = {
  /** The last private balance the host read for this token account, if any. */
  getBalance: (tokenAccountId: string) => ConfidentialBalance | undefined;
  /** Prepares a confidential transfer: coin-evm `prepareConfidentialSend` with the host's client. */
  prepareSend: (
    currencyId: string,
    p: {
      sender: string;
      recipient: string;
      underlying: string;
      amount: bigint;
      balance: ConfidentialBalance;
    },
  ) => Promise<PreparedConfidentialTx>;
};

let runtime: ConfidentialSendRuntime | undefined;

/** Set by the host app once it can serve confidential balances; `undefined` turns the source off. */
export const setConfidentialSendRuntime = (value: ConfidentialSendRuntime | undefined): void => {
  runtime = value;
};

export const getConfidentialSendRuntime = (): ConfidentialSendRuntime | undefined => runtime;

type SpendableBalance = Exclude<ConfidentialBalance, { state: "undisclosed" }>;

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
