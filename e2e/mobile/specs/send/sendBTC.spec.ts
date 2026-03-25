import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(
  Account.BTC_NATIVE_SEGWIT_1,
  Account.BTC_NATIVE_SEGWIT_2,
  "0.00001",
  Fee.SLOW,
);
runSendTest(
  transaction,
  ["B2CQA-4714"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bitcoin", "@family-bitcoin"],
);
