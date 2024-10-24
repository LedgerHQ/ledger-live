import {
  UnsignedTokenTransferOptions,
  estimateTransaction,
  makeUnsignedSTXTokenTransfer,
} from "@stacks/transactions";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import { StacksMainnet } from "@stacks/network";
import { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { createTransaction } from "./createTransaction";
import { StacksNetwork } from "./bridge/utils/api.types";
import { Transaction } from "./types";

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
  const network = StacksNetwork[dummyTx.network] || new StacksMainnet();

  const options: UnsignedTokenTransferOptions = {
    recipient,
    anchorMode,
    memo,
    network,
    publicKey: xpub,
    amount: amount.toFixed(),
  };

  const tx = await makeUnsignedSTXTokenTransfer(options);

  const [feeEst] = await estimateTransaction(tx.payload);

  const diff = spendableBalance.minus(new BigNumber(feeEst.fee));
  return diff.gte(0) ? diff : new BigNumber(0);
};
