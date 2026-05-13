import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSwapLandingPageTest } from "./swap.other";

const swapTestConfig = {
  fromAccount: Account.ETH_1,
  toAccount: TokenAccount.ETH_USDT_1,
  tmsLinks: ["B2CQA-2918", "B2CQA-2327", "B2CQA-3080"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapLandingPageTest(
  swapTestConfig.fromAccount,
  swapTestConfig.toAccount,
  swapTestConfig.tmsLinks,
  swapTestConfig.tags,
);
