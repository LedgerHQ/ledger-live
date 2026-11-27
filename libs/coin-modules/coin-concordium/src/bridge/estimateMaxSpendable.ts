import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { ConcordiumContext, Transaction } from "../types";
import { CONCORDIUM_DUMMY_ADDRESS } from "../constants";
import { createTransaction } from "./createTransaction";

export const buildEstimateMaxSpendable =
  (
    context: ConcordiumContext,
    prepareTransaction: AccountBridge<Transaction>["prepareTransaction"],
    getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"],
  ): AccountBridge<Transaction>["estimateMaxSpendable"] =>
  async ({ account, parentAccount, transaction }) => {
    // The fee is paid in CCD from the parent account and never reduces the token
    // balance, so all of it is spendable. The native line below subtracts µCCD
    // fees from `spendableBalance`, which on a sub-account is the token balance —
    // a unit error, and the reason this returns before reaching it.
    if (account.type === "TokenAccount") {
      return account.spendableBalance;
    }

    // The caller's transaction is spread below, so a stale `subAccountId` reaches
    // here too. Nothing here reads `status.errors`, so without this the native
    // path answers with the parent's whole CCD balance for an unsendable send.
    if (transaction?.subAccountId && !findSubAccountById(account, transaction.subAccountId)) {
      return new BigNumber(0);
    }

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
      context.logger("concordium", "estimateMaxSpendable failed", { error });
      return new BigNumber(0);
    }
  };
