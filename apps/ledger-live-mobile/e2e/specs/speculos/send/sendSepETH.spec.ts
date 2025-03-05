import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendTest } from "../send/send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.SLOW);
runSendTest(transaction, ["B2CQA-2574"]);
