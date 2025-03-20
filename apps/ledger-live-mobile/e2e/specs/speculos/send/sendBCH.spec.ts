import { runSendTest } from "../send/send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.BCH_1, Account.BCH_2, "0.0001", Fee.SLOW);
runSendTest(transaction, ["B2CQA-2808"]);
