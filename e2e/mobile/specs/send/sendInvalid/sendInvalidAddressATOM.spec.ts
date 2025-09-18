import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(Account.ATOM_1, Account.ATOM_1, "0.00001");
runSendInvalidAddressTest(transaction, "Destination and source accounts must not be the same.", [
  "B2CQA-2713",
]);
