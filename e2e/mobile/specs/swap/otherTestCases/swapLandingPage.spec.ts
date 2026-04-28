import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapLandingPageTest } from "./swap.other";

const swapTestConfig = {
  fromAccount: Account.BTC_NATIVE_SEGWIT_1,
  toAccount: Account.ETH_1,
  tmsLinks: ["B2CQA-2918", "B2CQA-2327", "B2CQA-3080"],
  tags: [
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
};

runSwapLandingPageTest(
  swapTestConfig.fromAccount,
  swapTestConfig.toAccount,
  swapTestConfig.tmsLinks,
  swapTestConfig.tags,
);
