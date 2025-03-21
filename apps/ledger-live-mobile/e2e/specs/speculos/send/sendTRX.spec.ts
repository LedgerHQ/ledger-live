import { runSendTest } from "../send/send";

const transaction = new Transaction(Account.TRX_1, Account.TRX_2, "0.01");
runSendTest(transaction, ["B2CQA-2812"]);
