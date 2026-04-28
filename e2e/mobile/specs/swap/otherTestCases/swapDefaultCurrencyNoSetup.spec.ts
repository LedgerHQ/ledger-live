import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapDefaultCurrencyNoSetupTest } from "./swap.other";

runSwapDefaultCurrencyNoSetupTest(
  Account.BTC_NATIVE_SEGWIT_1,
  ["B2CQA-3079"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bitcoin", "@family-bitcoin"],
);
