import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.BASE_1, Account.BASE_2, "0.000001");
runSendTest(transaction, ["B2CQA-4225"]);
