import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  estimateTransaction,
  estimateTransactionByteLength,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { StacksNetwork } from "../network/api.types";
import { Transaction } from "../types";
import { createTransaction } from "./createTransaction";
import { getAccountInfo } from "./utils/account";
import { getAddress } from "./utils/misc";
import { createTransaction as createStacksTransaction } from "./utils/transactions";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const { mainAccount, subAccount, tokenAccountTxn } = getAccountInfo({
    account,
    parentAccount,
    transaction,
  });

  const { address } = getAddress(account as Account);
  const { spendableBalance, xpub } = mainAccount;
  invariant(xpub, "xpub is required");

  // If it's a token transaction, return the token's spendable balance
  if (tokenAccountTxn && subAccount) {
    return subAccount.spendableBalance;
  }

  const dummyTx = {
    ...createTransaction(account),
    ...transaction,
    recipient: getAbandonSeedAddress(mainAccount.currency.id),
    useAllAmount: true,
  };

  // Create transaction using the shared utility function
  const tx = await createStacksTransaction(
    dummyTx,
    address,
    xpub,
    subAccount || undefined,
    undefined, // No fee yet
    undefined, // No nonce
  );

  // Get network configuration
  const network = StacksNetwork[dummyTx.network] || StacksNetwork.mainnet;

  // Estimate fee
  const [feeEst] = await estimateTransaction(
    tx.payload,
    estimateTransactionByteLength(tx),
    network,
  );

  // Calculate maximum spendable balance by subtracting fee
  const diff = spendableBalance.minus(new BigNumber(feeEst.fee));
  return diff.gte(0) ? diff : new BigNumber(0);
};
