import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_3, "0.00001", Fee.MEDIUM);
runSendValidAddressTest(transaction, ["B2CQA-2714"]);
