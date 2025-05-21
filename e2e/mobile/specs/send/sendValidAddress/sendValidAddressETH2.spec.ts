import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "0.00001", Fee.MEDIUM);
runSendValidAddressTest(transaction, ["B2CQA-2715", "B2CQA-2716"]);
