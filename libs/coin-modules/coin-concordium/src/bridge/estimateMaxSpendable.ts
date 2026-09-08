import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Transaction } from "../types";
import { CONCORDIUM_DUMMY_ADDRESS } from "../constants";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);

  try {
    const newTransaction = await prepareTransaction(mainAccount, {
      ...createTransaction(account),
      ...transaction,
      // Estimation runs before a recipient is chosen, so substitute a dummy one
      recipient: transaction?.recipient || CONCORDIUM_DUMMY_ADDRESS,
      amount: new BigNumber(0),
    });
    const status = await getTransactionStatus(mainAccount, newTransaction);
    return BigNumber.max(0, account.spendableBalance.minus(status.estimatedFees));
  } catch (error) {
    // Both callers consume this promise with no rejection handler
    // (`SpendableAmount.tsx`, `03a-AmountCoin.tsx`), so a throw here surfaces as
    // an unhandled rejection. The PLT path is the first preparation that can
    // reject at all, the native estimate having swallowed its own failures.
    // Zero rather than a partial figure, so a failed estimate can never read as
    // more spendable than it is.
    log("concordium", "estimateMaxSpendable failed", { error });
    return new BigNumber(0);
  }
};
