import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  TokenAccount.ETH_USDT_1,
  Account.SOL_1,
  ["B2CQA-2751"],
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
