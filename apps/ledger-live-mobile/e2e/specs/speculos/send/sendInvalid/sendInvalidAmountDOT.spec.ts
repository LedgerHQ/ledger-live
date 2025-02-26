import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendInvalidAmountTest } from "../send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_2, "1.2");
runSendInvalidAmountTest(transaction, "Balance cannot be below 1 DOT. Send max to empty account.", [
  "B2CQA-2567",
]);
