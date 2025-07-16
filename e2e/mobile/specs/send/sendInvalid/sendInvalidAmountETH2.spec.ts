import { runSendInvalidAmountTest } from "../send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "0", Fee.MEDIUM);
runSendInvalidAmountTest(transaction, "", ["B2CQA-2569"]);
