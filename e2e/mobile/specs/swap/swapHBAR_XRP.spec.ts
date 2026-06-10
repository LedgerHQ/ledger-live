import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.HEDERA_1,
  Account.XRP_1,
  ["B2CQA-3753"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@hedera",
    "@family-hedera",
    "@ripple",
    "@family-xrp",
  ],
);
