import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapLandingPageTest } from "@e2e/specs/swap/otherTestCases/swap.other";

const swapTestConfig = {
  fromAccount: Account.ETH_1,
  toAccount: TokenAccount.ETH_USDT_1,
  tmsLinks: { landingPage: ["B2CQA-2918", "B2CQA-2327", "B2CQA-3080"], formatting: ["B2CQA-4014"] },
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapLandingPageTest(
  swapTestConfig.fromAccount,
  swapTestConfig.toAccount,
  swapTestConfig.tmsLinks,
  swapTestConfig.tags,
);
