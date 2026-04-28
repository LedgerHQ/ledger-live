import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapBlacklistedAddressTest } from "./swap.other";

runSwapBlacklistedAddressTest(
  Account.SANCTIONED_ETH,
  Account.XRP_1,
  ["B2CQA-3655"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@ripple",
    "@family-xrp",
  ],
);
