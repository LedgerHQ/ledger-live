import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import { StacksMainnet } from "@stacks/network";
import { log } from "@ledgerhq/logs";
import {
  AddressVersion,
  TransactionVersion,
  UnsignedTokenTransferOptions,
  estimateTransaction,
  estimateTransactionByteLength,
  makeUnsignedSTXTokenTransfer,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { c32address } from "c32check";
import invariant from "invariant";
import { StacksNetwork } from "../network/api.types";
import { Transaction } from "../types";
import { validateAddress } from "./utils/addresses";
import { findNextNonce } from "./utils/misc";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const { spendableBalance, pendingOperations, xpub } = account;
  const { recipient, useAllAmount } = transaction;
  invariant(xpub, "xpub is required");

  const patch: Partial<Transaction> = {};
  if (xpub && recipient && validateAddress(recipient).isValid) {
    const { anchorMode, memo, amount } = transaction;

    const network = StacksNetwork[transaction.network] || new StacksMainnet();

    // Check if recipient is valid
    const options: UnsignedTokenTransferOptions = {
      recipient,
      anchorMode,
      memo,
      network,
      publicKey: xpub,
      amount: amount.toFixed(),
    };

    log("stacks.prepareTransaction", `options: ${JSON.stringify({...options, amount: options.amount.toString()})}`)
    const tx = await makeUnsignedSTXTokenTransfer(options);

    const addressVersion =
      network.version === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;
    const senderAddress = c32address(addressVersion, tx.auth.spendingCondition!.signer);
  const byteLength = estimateTransactionByteLength(tx);
  console.log({byteLengthPrepare: byteLength})
  log("stacks.prepareTransaction", `tx: ${JSON.stringify({...tx.payload, amount: (tx.payload as any)?.amount?.toString()})}`);
  log("stacks.prepareTransaction", `byteLength: ${byteLength}`);

    const [fee] = await estimateTransaction(tx.payload, estimateTransactionByteLength(tx));

    patch.fee = new BigNumber(fee.fee);
    patch.nonce = await findNextNonce(senderAddress, pendingOperations);

    if (useAllAmount) patch.amount = spendableBalance.minus(patch.fee);
  }

  return updateTransaction(transaction, patch);
};
