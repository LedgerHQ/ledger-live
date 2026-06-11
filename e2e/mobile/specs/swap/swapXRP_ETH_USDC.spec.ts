import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.XRP_1,
  TokenAccount.ETH_USDC_1,
  ["B2CQA-3075"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ripple",
    "@family-xrp",
    "@ethereum",
    "@family-evm",
  ],
);
