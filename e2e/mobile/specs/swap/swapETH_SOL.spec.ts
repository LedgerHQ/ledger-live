import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.ETH_1,
  Account.SOL_1,
  ["B2CQA-2748"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@solana",
    "@family-solana",
  ],
);
