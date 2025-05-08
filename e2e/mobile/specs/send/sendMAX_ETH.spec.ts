import { runSendMaxTest } from "./send";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "max", Fee.MEDIUM);
runSendMaxTest(transaction, ["B2CQA-473"]);
