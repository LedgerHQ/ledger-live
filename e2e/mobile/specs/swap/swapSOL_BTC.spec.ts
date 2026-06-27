import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.SOL_1,
  Account.BTC_NATIVE_SEGWIT_1,
  ["B2CQA-2776"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@solana",
    "@family-solana",
    "@bitcoin",
    "@family-bitcoin",
  ],
);
