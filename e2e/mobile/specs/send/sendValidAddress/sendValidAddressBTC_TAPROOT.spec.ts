import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(
  Account.BTC_TAPROOT_1,
  Account.BTC_TAPROOT_2,
  "0.00001",
  Fee.MEDIUM,
);
runSendValidAddressTest(transaction, ["B2CQA-2725"]);
