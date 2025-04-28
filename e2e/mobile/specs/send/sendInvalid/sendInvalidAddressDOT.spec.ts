import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(Account.DOT_1, Account.DOT_1, "0.5");
runSendInvalidAddressTest(transaction, "Destination and source accounts must not be the same.", [
  "B2CQA-2711",
]);
