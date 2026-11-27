import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e-mobile/specs/swap.test";

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
