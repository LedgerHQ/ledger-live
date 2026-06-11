import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.SOL_1,
  Account.ETH_1,
  ["B2CQA-2775"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@solana",
    "@family-solana",
    "@ethereum",
    "@family-evm",
  ],
);
