import { runSendInvalidAmountTest } from "../send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_3, "0.5");
runSendInvalidAmountTest(transaction, "Minimum of 1 DOT needed to activate recipient address", [
  "B2CQA-2570",
]);
