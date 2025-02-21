import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendTest } from "../send/send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_2, "0.0001", undefined, "noTag");
runSendTest(transaction, ["B2CQA-2816"]);
