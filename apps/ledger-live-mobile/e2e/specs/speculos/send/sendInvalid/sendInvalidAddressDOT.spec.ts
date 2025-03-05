import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_1, "0.5");
runSendInvalidAddressTest(transaction, "Destination and source accounts must not be the same.", [
  "B2CQA-2711",
]);
