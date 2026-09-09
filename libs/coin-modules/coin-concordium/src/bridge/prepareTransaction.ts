import type { AccountBridge, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import {
  AccountAddress,
  encodePltTransferOperations,
  PLT_MAX_DECIMALS,
  PLT_MAX_MEMO_SIZE,
} from "@ledgerhq/concordium-core";
import type { ConcordiumCoinConfig, Transaction } from "../types";
import { estimateFees, estimateTokenFees } from "../logic";
import type { FeeEstimation } from "../logic/transaction/estimateFees";
import { CONCORDIUM_DUMMY_ADDRESS } from "../constants";
import { effectivePltAmount } from "./tokens";
import coinConfig from "../config";

/**
 * Parses the recipient, falling back to the dummy address.
 *
 * A parse failure is the common case, not an error: the recipient is still
 * being typed. Substituting is exact rather than approximate, because every
 * Concordium address encodes to the same 32 bytes and the blob's length is all
 * the fee depends on.
 */
function recipientForEstimation(recipient: string): AccountAddress {
  try {
    return AccountAddress.fromBase58(recipient);
  } catch {
    return AccountAddress.fromBase58(CONCORDIUM_DUMMY_ADDRESS);
  }
}

/**
 * Estimates a PLT transfer fee, encoding the operations blob first.
 *
 * The order is the reverse of the CCD path's because `listOperationsSize` is the
 * blob's byte length, so the payload has to exist before it can be priced.
 *
 * The memo counts toward `listOperationsSize`, so omitting it underprices the
 * transfer — a 256-byte memo is worth more energy than the buffer absorbs.
 *
 * Resolves to `undefined` when the transfer cannot be priced at all: a missing
 * magnitude, more decimals than the device will sign, or a memo past the chain's
 * limit. Sync only builds a sub-account whose CAL magnitude matches the chain's
 * decimals, so the first should not occur.
 *
 * The decimals check has to happen here rather than being left to the encoder.
 * `encodePltTransferOperations` throws above {@link PLT_MAX_DECIMALS}, and a
 * throw from this function rejects `prepareTransaction`, which the send flow
 * reports as a generic failure and retries. Returning `undefined` leaves the
 * fee unset instead, so `getTransactionStatus` runs and names the real problem.
 */
async function estimatePltFees(
  config: ConcordiumCoinConfig,
  currencyId: string,
  subAccount: TokenAccount,
  transaction: Transaction,
): Promise<FeeEstimation | undefined> {
  const decimals = subAccount.token.units[0]?.magnitude;
  if (decimals === undefined || decimals > PLT_MAX_DECIMALS) return undefined;

  const memo = transaction.memo ? Buffer.from(transaction.memo, "utf-8") : undefined;
  if (memo && memo.length > PLT_MAX_MEMO_SIZE) return undefined;

  const operations = encodePltTransferOperations({
    recipient: recipientForEstimation(transaction.recipient),
    amount: effectivePltAmount(subAccount, transaction),
    decimals,
    ...(memo ? { memo } : {}),
  });

  return estimateTokenFees(config, currencyId, {
    tokenId: subAccount.token.contractAddress,
    listOperationsSize: operations.length,
  });
}

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const config = coinConfig.getCoinConfig(account.currency.id);
  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");

  // Leaving the fee unset is what lets status report the stale reference.
  if (subAccount?.type !== "TokenAccount" && transaction.subAccountId) {
    return transaction;
  }

  if (subAccount?.type === "TokenAccount") {
    const estimation = await estimatePltFees(config, account.currency.id, subAccount, transaction);
    if (!estimation) return transaction;

    const fee = new BigNumber(estimation.cost.toString());
    const energy = Number(estimation.energy);

    // Both are compared, so that a re-estimate which moves only the energy is
    // still persisted rather than discarded as unchanged.
    if (transaction.fee?.isEqualTo(fee) && transaction.energy === energy) {
      return transaction;
    }

    return { ...transaction, fee, energy };
  }

  const estimation = await estimateFees(config, account.currency.id, transaction.memo);
  const fee = new BigNumber(estimation.cost.toString());

  // Only the PLT path persists `energy`, so one arriving here belonged to a
  // token transfer the account has since moved away from. `updateTransaction`
  // resets `fee` on every patch but carries `energy` across, so it is dropped
  // here rather than left for signing to pair with a native fee.
  if (transaction.fee?.isEqualTo(fee) && transaction.energy === undefined) {
    return transaction;
  }

  const { energy: _stale, ...withoutEnergy } = transaction;
  return { ...withoutEnergy, fee };
};
