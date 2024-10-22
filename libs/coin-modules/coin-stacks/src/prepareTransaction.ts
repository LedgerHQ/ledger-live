import {
  AddressVersion,
  TransactionVersion,
  UnsignedTokenTransferOptions,
  estimateTransaction,
  makeUnsignedSTXTokenTransfer,
} from "@stacks/transactions";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import { c32address } from "c32check";
import { StacksMainnet } from "@stacks/network";
import { AccountBridge } from "@ledgerhq/types-live";
import { validateAddress } from "./bridge/utils/addresses";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { StacksNetwork } from "./bridge/utils/api.types";
import { findNextNonce } from "./bridge/utils/misc";
import { Transaction } from "./types";

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

    const tx = await makeUnsignedSTXTokenTransfer(options);

    const addressVersion =
      network.version === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;
    const senderAddress = c32address(addressVersion, tx.auth.spendingCondition!.signer);

    const [fee] = await estimateTransaction(tx.payload);

    patch.fee = new BigNumber(fee.fee);
    patch.nonce = await findNextNonce(senderAddress, pendingOperations);

    if (useAllAmount) patch.amount = spendableBalance.minus(patch.fee);
  }

  return defaultUpdateTransaction(transaction, patch);
};
