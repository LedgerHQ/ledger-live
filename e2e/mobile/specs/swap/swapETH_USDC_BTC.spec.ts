import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

const swap = new Swap(
  TokenAccount.ETH_USDC_1,
  Account.BTC_NATIVE_SEGWIT_1,
  "65",
  undefined,
  Fee.MEDIUM,
);
runSwapTest(
  swap,
  ["B2CQA-2832", "B2CQA-3281"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@bitcoin",
    "@family-bitcoin",
  ],
);
