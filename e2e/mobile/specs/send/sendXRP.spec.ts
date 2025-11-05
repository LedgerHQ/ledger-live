import { runSendTest } from "./send";

// Existing issue LIVE-22207
const transaction = new Transaction(Account.XRP_1, Account.XRP_2, "0.0001", undefined, "noTag");
runSendTest(transaction, ["B2CQA-2816"]);
