import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_2, "0.0001");
runSendTest(transaction, ["B2CQA-2809"]);
