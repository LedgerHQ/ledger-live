import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { ONE_SUI } from "../constants";
import type { SuiAccount, Transaction } from "../types";
import createTransaction from "./createTransaction";
import getFeesForTransaction from "./getFeesForTransaction";

/**
 * Returns the maximum possible amount for transaction
 * @typedef {Object} EstimateMaxSpendableParams
 * @property {SuiAccount} account - The account from which to estimate the maximum spendable amount.
 * @property {SuiAccount} [parentAccount] - The parent account, if applicable.
 * @property {Transaction} transaction - The transaction details for which to estimate the maximum spendable amount.
 *
 * @returns {Promise<BigNumber>} The estimated maximum spendable amount.
 */
export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  try {
    const mainAccount = getMainAccount(account, parentAccount) as SuiAccount;

    const estimatedTransaction = {
      ...createTransaction(account),
      ...transaction,
      useAllAmount: true,
    };

    let spendableBalance = account.spendableBalance;

    if (transaction?.mode !== "delegate") {
      if (account.type === "Account") {
        const fees = await getFeesForTransaction({
          account: mainAccount,
          transaction: estimatedTransaction,
        });
        if (fees) {
          spendableBalance = spendableBalance.minus(fees);
        }
      }
    }
    // Apply delegation-specific constraints
    if (transaction?.mode === "delegate") {
      // Reserve 0.1 SUI for future gas fees as recommended
      const gasReserve = new BigNumber(ONE_SUI).div(10);
      spendableBalance = spendableBalance.minus(gasReserve);

      // Ensure we don't go below 1 SUI minimum for delegation
      const oneSui = new BigNumber(ONE_SUI);
      if (spendableBalance.lt(oneSui)) {
        return new BigNumber(0);
      }
    }

    return BigNumber.max(spendableBalance, 0);
  } catch {
    return new BigNumber(0);
  }
};

export default estimateMaxSpendable;
