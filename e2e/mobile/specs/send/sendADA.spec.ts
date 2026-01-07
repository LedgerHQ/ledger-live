import { runSendTest } from "./send";

const transaction = new Transaction(Account.ADA_1, Account.ADA_2, "1", undefined, "noTag");
runSendTest(transaction, ["B2CQA-2815"]);
