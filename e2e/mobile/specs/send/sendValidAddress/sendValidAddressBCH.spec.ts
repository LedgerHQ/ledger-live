import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.BCH_1, Account.BCH_2, "0.0001", Fee.MEDIUM);
runSendValidAddressTest(transaction, ["B2CQA-2726"]);
