import { Account, AccountBridge } from "@ledgerhq/types-live";
import { estimateTransactionByteLength, serializePayload } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { STACKS_DUMMY_ADDRESS } from "../constants";
import { fetchLowTransactionFee } from "../network/fees";
import { getStacksBaseUrl } from "../network/api";
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
    recipient: STACKS_DUMMY_ADDRESS,
    useAllAmount: true,
  };

  // Create transaction using the shared utility function
  const tx = await createStacksTransaction(dummyTx, address, xpub, subAccount || undefined);

  const fee = await fetchLowTransactionFee({
    payload: serializePayload(tx.payload),
    estimatedLength: estimateTransactionByteLength(tx),
    network: dummyTx.network,
    client: { baseUrl: getStacksBaseUrl() },
  });

  const diff = spendableBalance.minus(new BigNumber(fee));
  return diff.gte(0) ? diff : new BigNumber(0);
};
