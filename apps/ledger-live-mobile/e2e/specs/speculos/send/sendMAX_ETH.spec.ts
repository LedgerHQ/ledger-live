import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendMaxTest } from "../send/send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "max", Fee.MEDIUM);
runSendMaxTest(transaction, ["B2CQA-473"]);
