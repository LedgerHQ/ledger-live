import type { AccountBridge, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { AccountAddress, encodePltTransferOperations } from "@ledgerhq/concordium-core";
import type { ConcordiumCoinConfig, Transaction } from "../types";
import { estimateFees, estimateTokenFees } from "../logic";
import type { FeeEstimation } from "../logic/transaction/estimateFees";
import { CONCORDIUM_DUMMY_ADDRESS } from "../constants";
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
 * Resolves to `undefined` when the token's magnitude is missing. Sync only
 * builds a sub-account whose CAL magnitude matches the chain's decimals, so
 * this should not occur; leaving the fee unset is still preferable to pricing a
 * blob encoded with a guessed exponent, which the chain would reject outright.
 */
async function estimatePltFees(
  config: ConcordiumCoinConfig,
  currencyId: string,
  subAccount: TokenAccount,
  transaction: Transaction,
): Promise<FeeEstimation | undefined> {
  const decimals = subAccount.token.units[0]?.magnitude;
  if (decimals === undefined) return undefined;

  const operations = encodePltTransferOperations({
    recipient: recipientForEstimation(transaction.recipient),
    amount: BigInt(transaction.amount.toFixed(0)),
    decimals,
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
