import { runSendInvalidTokenAmountTest } from "../send";

const transaction = new Transaction(Account.ETH_USDT_1, Account.ETH_USDT_2, "10000");
runSendInvalidTokenAmountTest(transaction, "Sorry, insufficient funds", ["B2CQA-3043"]);
