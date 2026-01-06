import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.BCH_1, Account.BCH_2, "0.0001", Fee.SLOW);
runSendTest(transaction, ["B2CQA-2808"]);
