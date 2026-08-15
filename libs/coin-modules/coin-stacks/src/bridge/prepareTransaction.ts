import { updateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import {
  AddressVersion,
  estimateTransactionByteLength,
  fetchFeeEstimateTransaction,
  serializePayload,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { c32address } from "c32check";
import invariant from "invariant";
import { getStacksBaseUrl } from "../network/api";
import { Transaction } from "../types";
import { validateAddress } from "../common-logic";
import { findNextNonce, getAddress } from "./utils/misc";
import { getSubAccount } from "./utils/token";
import { createTransaction } from "./utils/transactions";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const { address } = getAddress(account);
  const { spendableBalance, pendingOperations, xpub } = account;
  const { recipient, useAllAmount } = transaction;
  invariant(xpub, "xpub is required");

  const patch: Partial<Transaction> = {};

  if (xpub && recipient && validateAddress(recipient).isValid) {
    const { network } = transaction;
    const addressVersion =
      network === "mainnet" ? AddressVersion.MainnetSingleSig : AddressVersion.TestnetSingleSig;

    // Check if this is a token transaction
    const subAccount = getSubAccount(account, transaction);

    // Create transaction
    const tx = await createTransaction(transaction, address, xpub, subAccount);

    const senderAddress = c32address(addressVersion, tx.auth.spendingCondition!.signer);

    // A pre-set positive fee (e.g. a devnet/testnet caller working around a node whose fee
    // estimator has no historical data yet for this payload shape) skips the network call
    // entirely — additive only, real callers never pre-set `fee` before this step.
    if (transaction.fee && transaction.fee.gt(0)) {
      patch.fee = transaction.fee;
    } else {
      // [low, medium, high] tuple; index 0 matches this call's pre-existing "low" behavior.
      const [fee] = await fetchFeeEstimateTransaction({
        payload: serializePayload(tx.payload),
        estimatedLength: estimateTransactionByteLength(tx),
        network,
        client: { baseUrl: getStacksBaseUrl() },
      });

      patch.fee = new BigNumber(fee.fee);
    }
    patch.nonce = await findNextNonce(senderAddress, pendingOperations);

    // For token transfers and useAllAmount
    if (useAllAmount) {
      if (subAccount) {
        patch.amount = subAccount.spendableBalance;
      } else {
        patch.amount = spendableBalance.minus(patch.fee);
      }
    }
  }

  return updateTransaction(transaction, patch);
};
