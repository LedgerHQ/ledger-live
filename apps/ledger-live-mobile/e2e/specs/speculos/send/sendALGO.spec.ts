import { runSendTest } from "../send/send";

const transaction = new Transaction(Account.ALGO_1, Account.ALGO_2, "0.001", undefined, "noTag");
runSendTest(transaction, ["B2CQA-2810"]);
