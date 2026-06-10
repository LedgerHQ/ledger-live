import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.XRP_1,
  Account.BTC_NATIVE_SEGWIT_1,
  ["B2CQA-3077", "B2CQA-3281"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ripple",
    "@family-xrp",
    "@bitcoin",
    "@family-bitcoin",
  ],
);
