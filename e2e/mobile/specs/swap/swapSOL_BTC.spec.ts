import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

const swap = new Swap(Account.SOL_1, Account.BTC_NATIVE_SEGWIT_1, "0.3", undefined, Fee.MEDIUM);
runSwapTest(
  swap,
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
