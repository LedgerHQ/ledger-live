import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendTest } from "../send/send";

const transaction = new Transaction(Account.XLM_1, Account.XLM_2, "0.0001", undefined, "noTag");
runSendTest(transaction, ["B2CQA-2813"]);
