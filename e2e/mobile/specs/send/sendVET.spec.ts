import { runSendTest } from "./send";

const transaction = new Transaction(Account.VET_1, Account.VET_2, "0.1");
runSendTest(transaction, ["B2CQA-4247"]);
