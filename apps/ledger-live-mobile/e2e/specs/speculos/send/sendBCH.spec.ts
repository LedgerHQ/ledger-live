import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendTest } from "../send/send";

const transaction = new Transaction(Account.BCH_1, Account.BCH_2, "0.0001");
runSendTest(transaction, "B2CQA-2808");
