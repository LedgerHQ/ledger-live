import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

const swap = new Swap(Account.HEDERA_1, Account.XRP_1, "15", undefined, Fee.MEDIUM);
runSwapTest(
  swap,
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
