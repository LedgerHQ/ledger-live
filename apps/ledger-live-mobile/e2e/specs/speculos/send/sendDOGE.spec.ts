import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendTest } from "../send/send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.DOGE_1, Account.DOGE_2, "0.01", Fee.SLOW);
runSendTest(transaction, ["B2CQA-2573"]);
