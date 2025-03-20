import { runSendTest } from "../send/send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.POL_1, Account.POL_2, "0.001", Fee.SLOW);
runSendTest(transaction, ["B2CQA-2807"]);
