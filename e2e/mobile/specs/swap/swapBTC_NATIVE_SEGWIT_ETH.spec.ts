import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

const swap = new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.0006", undefined, Fee.MEDIUM);
runSwapTest(
  swap,
  ["B2CQA-2744", "B2CQA-2432", "B2CQA-3450"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@swapSmoke",
    "@ethereum",
    "@family-evm",
    "@bitcoin",
    "@family-bitcoin",
  ],
);
