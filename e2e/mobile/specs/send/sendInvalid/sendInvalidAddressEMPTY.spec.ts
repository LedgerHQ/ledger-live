import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.EMPTY, "0.00001", Fee.MEDIUM);
runSendInvalidAddressTest(transaction, "", ["B2CQA-2710"]);
