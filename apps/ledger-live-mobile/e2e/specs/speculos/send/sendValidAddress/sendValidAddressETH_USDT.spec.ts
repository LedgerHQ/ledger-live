import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendValidAddressTest } from "../send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.ETH_USDT_1, Account.ETH_USDT_2, "1", Fee.MEDIUM);
runSendValidAddressTest(
  transaction,
  ["B2CQA-2703", "B2CQA-475"],
  transaction.accountToDebit.currency.name,
);
