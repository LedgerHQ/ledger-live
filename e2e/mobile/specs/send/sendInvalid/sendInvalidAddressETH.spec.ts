import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(
  Account.ETH_1,
  Account.BTC_NATIVE_SEGWIT_1,
  "0.00001",
  Fee.MEDIUM,
);
runSendInvalidAddressTest(
  transaction,
  "This is not a valid Ethereum address",
  "bc1q550hm43wj0jq949xwsw67kwzz0t3wy60y3gfax",
  ["B2CQA-2709"],
);
