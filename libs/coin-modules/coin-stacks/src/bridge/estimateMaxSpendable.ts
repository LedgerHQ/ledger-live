import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { AccountBridge } from "@ledgerhq/types-live";
import {
  UnsignedTokenTransferOptions,
  estimateTransaction,
  estimateTransactionByteLength,
  makeUnsignedSTXTokenTransfer,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { StacksNetwork } from "../network/api.types";
import { Transaction } from "../types";
import { createTransaction } from "./createTransaction";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { spendableBalance, xpub } = mainAccount;
  invariant(xpub, "xpub is required");

  const dummyTx = {
    ...createTransaction(account),
    ...transaction,
    recipient: getAbandonSeedAddress(mainAccount.currency.id),
    useAllAmount: true,
  };
  // Compute fees
  const { recipient, anchorMode, memo, amount } = dummyTx;

  const network = StacksNetwork[dummyTx.network] || StacksNetwork["mainnet"];

  const options: UnsignedTokenTransferOptions = {
    recipient,
    anchorMode,
    memo,
    network,
    publicKey: xpub,
    amount: amount.toFixed(),
  };

  const tx = await makeUnsignedSTXTokenTransfer(options);

  const [feeEst] = await estimateTransaction(
    tx.payload,
    estimateTransactionByteLength(tx),
    network,
  );

  const diff = spendableBalance.minus(new BigNumber(feeEst.fee));
  return diff.gte(0) ? diff : new BigNumber(0);
};
