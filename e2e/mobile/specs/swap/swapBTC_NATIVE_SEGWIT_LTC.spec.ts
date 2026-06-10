import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.BTC_NATIVE_SEGWIT_1,
  Account.LTC_1,
  ["B2CQA-3078"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@bitcoin",
    "@family-bitcoin",
    "@litecoin",
    "@family-litecoin",
  ],
);
