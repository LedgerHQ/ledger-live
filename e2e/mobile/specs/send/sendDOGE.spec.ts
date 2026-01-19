import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.DOGE_1, Account.DOGE_2, "0.01", Fee.SLOW);
runSendTest(transaction, ["B2CQA-2573"]);
