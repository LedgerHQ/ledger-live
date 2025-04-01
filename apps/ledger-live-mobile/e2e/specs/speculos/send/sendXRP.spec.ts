import { runSendTest } from "../send/send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_2, "0.0001", undefined, "noTag");
runSendTest(transaction, ["B2CQA-2816"]);
