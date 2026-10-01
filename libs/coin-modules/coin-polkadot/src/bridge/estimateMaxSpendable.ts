import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { PolkadotContext } from "../config";
import type { PolkadotAccount, Transaction } from "../types";
import createTransaction from "./createTransaction";
import getEstimatedFees from "./getFeesForTransaction";
import { calculateAmount } from "./utils";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
export const buildEstimateMaxSpendable =
  (context: PolkadotContext): AccountBridge<Transaction>["estimateMaxSpendable"] =>
  async ({ account, parentAccount, transaction }) => {
    const mainAccount = getMainAccount(account, parentAccount) as PolkadotAccount;
    const config = await context.config(mainAccount.currency.id);
    const estimatedTransaction = {
      ...createTransaction(account),
      ...transaction,
      useAllAmount: true,
    };
    const fees = await getEstimatedFees(context, {
      account: mainAccount,
      transaction: estimatedTransaction,
    });
    return calculateAmount({
      config,
      account: mainAccount,
      transaction: { ...estimatedTransaction, fees },
    });
  };
