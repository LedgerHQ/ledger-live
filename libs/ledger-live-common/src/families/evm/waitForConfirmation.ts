import type { Account } from "@ledgerhq/types-live";
import { isTransactionConfirmed } from "@ledgerhq/coin-evm/editTransaction/isTransactionConfirmed";
import { delay } from "../../promise";

export type WaitForConfirmationOpts = {
  timeoutMs?: number;
  pollIntervalMs?: number;
};

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_POLL_INTERVAL_MS = 2_000;

/**
 * Wait until an EVM transaction is confirmed on-chain (included in a block).
 * No-op for non-EVM accounts.
 *
 * @param account - main account (currency used to resolve node API)
 * @param hash - transaction hash returned from broadcast
 * @param opts - optional timeout and poll interval
 * @throws if timeout is reached before confirmation
 */
export async function waitForTransactionConfirmation(
  account: Account,
  hash: string,
  opts: WaitForConfirmationOpts = {},
): Promise<void> {
  if (account.currency.family !== "evm") {
    return;
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = opts.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const confirmed = await isTransactionConfirmed({
      currency: account.currency,
      hash,
    });
    if (confirmed) {
      return;
    }
    await delay(pollIntervalMs);
  }

  throw new Error(`Transaction ${hash} was not confirmed within ${timeoutMs}ms.`);
}
