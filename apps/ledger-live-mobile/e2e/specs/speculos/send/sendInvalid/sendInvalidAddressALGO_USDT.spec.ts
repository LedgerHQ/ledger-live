import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendInvalidAddressTest } from "../send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.ALGO_USDT_1, Account.ALGO_USDT_2, "0.1", Fee.MEDIUM);
runSendInvalidAddressTest(
  transaction,
  "Recipient account has not opted in the selected ASA.",
  ["B2CQA-2702"],
  transaction.accountToDebit.currency.name,
);
