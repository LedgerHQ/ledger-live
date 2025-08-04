import { runSendInvalidAmountTest } from "../send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_2, "1.2");
runSendInvalidAmountTest(transaction, "Sorry, insufficient funds", ["B2CQA-2567"]);
