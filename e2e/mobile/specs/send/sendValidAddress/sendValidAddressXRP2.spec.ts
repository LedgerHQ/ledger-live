import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_2, "2", undefined, "noTag");
runSendValidAddressTest(transaction, ["B2CQA-2719"]);
