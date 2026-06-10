import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapTest } from "./swap";

runSwapTest(
  Account.BTC_NATIVE_SEGWIT_1,
  TokenAccount.ETH_USDT_1,
  ["B2CQA-2746"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@bitcoin",
    "@family-bitcoin",
    "@ethereum",
    "@family-evm",
  ],
);
