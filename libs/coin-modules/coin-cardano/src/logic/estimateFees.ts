import type {
  FeeEstimation,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { buildUnsignedTransaction } from "./craftTransaction";

/**
 * Estimate the fee for a Cardano transaction intent. On Cardano the fee is deterministic —
 * derived purely from the transaction size against the protocol parameters — so the estimate
 * is identical in nature for native, token and staking transactions: build the unsigned
 * transaction and read the fee Typhon computed while balancing it.
 *
 * Cardano has no fee market or priority, so there is nothing to parameterize; the API layer
 * accepts the contract's `customFeesParameters` but ignores it for Cardano.
 */
export async function estimateFees(
  currency: CryptoCurrency,
  intent: TransactionIntent<StringMemo>,
): Promise<FeeEstimation> {
  const tx = await buildUnsignedTransaction(currency, intent);
  return { value: BigInt(tx.getFee().toFixed(0)) };
}
