import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapTest } from "@e2e-mobile/specs/swap.test";

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
