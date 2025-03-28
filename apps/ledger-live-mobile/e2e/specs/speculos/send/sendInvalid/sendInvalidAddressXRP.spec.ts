import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_1, "1", undefined, "123456");
runSendInvalidAddressTest(transaction, "Destination and source accounts must not be the same.", [
  "B2CQA-2712",
]);
