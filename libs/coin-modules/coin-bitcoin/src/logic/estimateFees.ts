import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../api/config";
import { buildSyncedAccount } from "./buildAccount";
import { buildCandidateTx } from "./buildCandidateTx";
import { feePerByteOverride, resolveFeePerByte } from "./feeRate";

/**
 * Estimate the network fee for the send `intent` from the account (xpub).
 *
 * Coin-selects over the account's current UTXOs at the effective fee rate and returns the resulting
 * fee (`fee = feeRate × vsize`). A user-provided rate (`customFeesParameters.feePerByte`, sat/vB)
 * overrides the network estimate — the same resolution `craftTransaction` uses, so the quote and the
 * crafted tx agree. The rate used is echoed back in `parameters.feePerByte`. `useAllAmount` estimates
 * the sweep fee. Stateless: the account is rebuilt and re-synced each call. `intent.sender` carries
 * the xpub; `intent.senderDerivationPath` locates the account.
 */
export async function estimateFees(
  _context: BitcoinContext,
  currencyId: string,
  intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const account = await buildSyncedAccount(currencyId, intent.sender, intent.senderDerivationPath);
  const feePerByte = feePerByteOverride(customFeesParameters) ?? (await resolveFeePerByte(account));
  const txInfo = await buildCandidateTx(
    account,
    intent.recipient,
    intent.amount,
    feePerByte,
    intent.useAllAmount,
  );
  return { value: BigInt(txInfo.fee), parameters: { feePerByte } };
}
