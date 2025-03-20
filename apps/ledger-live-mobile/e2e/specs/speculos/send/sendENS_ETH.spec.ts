import { runSendENSTest } from "../send/send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "0.0001", Fee.MEDIUM);
runSendENSTest(transaction, ["B2CQA-2202"]);
