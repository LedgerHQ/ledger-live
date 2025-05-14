import { runSendInvalidAmountTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "100", Fee.MEDIUM);
runSendInvalidAmountTest(transaction, "Sorry, insufficient funds", ["B2CQA-2572"]);
