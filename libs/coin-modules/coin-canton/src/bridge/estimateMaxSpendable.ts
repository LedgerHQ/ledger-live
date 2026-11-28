import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CantonContext } from "../config";
import { Transaction, CantonAccount } from "../types";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";

export const estimateMaxSpendable = async (
  context: CantonContext,
  {
    account,
    parentAccount,
    transaction,
  }: Parameters<AccountBridge<Transaction, CantonAccount>["estimateMaxSpendable"]>[0],
): Promise<BigNumber> => {
  // The parent account pays a token's fee in CC.
  if (account.type === "TokenAccount") return account.spendableBalance;

  const { amount } = await prepareTransaction(context, getMainAccount(account, parentAccount), {
    ...createTransaction(account),
    ...transaction,
    subAccountId: undefined,
    useAllAmount: true,
  });
  return amount;
};
