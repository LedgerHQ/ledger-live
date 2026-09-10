import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapQuoteCardVariantsTest } from "@e2e/specs/swap/otherTestCases/swapQuoteCardVariants";

const swapQuoteCardVariantsTestConfig = {
  fromAccount: Account.ETH_1,
  toAccount: Account.BTC_NATIVE_SEGWIT_1,
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

runSwapQuoteCardVariantsTest(
  swapQuoteCardVariantsTestConfig.fromAccount,
  swapQuoteCardVariantsTestConfig.toAccount,
  swapQuoteCardVariantsTestConfig.tags,
);
