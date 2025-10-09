import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import {
  AddressVersion,
  TransactionVersion,
  estimateTransaction,
  estimateTransactionByteLength,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { c32address } from "c32check";
import invariant from "invariant";
import { StacksNetwork } from "../network/api.types";
import { Transaction } from "../types";
import { validateAddress } from "./utils/addresses";
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
    const networkConfig = StacksNetwork[network] || StacksNetwork["mainnet"];
    const addressVersion =
      networkConfig.version === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;

    // Check if this is a token transaction
    const subAccount = getSubAccount(account, transaction);

    // Create transaction
    const tx = await createTransaction(transaction, address, xpub, subAccount);

    const senderAddress = c32address(addressVersion, tx.auth.spendingCondition!.signer);

    const [fee] = await estimateTransaction(
      tx.payload,
      estimateTransactionByteLength(tx),
      networkConfig,
    );

    patch.fee = new BigNumber(fee.fee);
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
