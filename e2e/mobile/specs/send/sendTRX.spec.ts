import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.TRX_1, Account.TRX_2, "0.01");
runSendTest(transaction, ["B2CQA-2812"]);
