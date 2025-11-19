import { runSwapLandingPageTest } from "./swap.other";

const swapTestConfig = {
  fromAccount: Account.ETH_1,
  toAccount: TokenAccount.ETH_USDC_1,
  tmsLinks: ["B2CQA-2918"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
};

runSwapLandingPageTest(
  swapTestConfig.fromAccount,
  swapTestConfig.toAccount,
  swapTestConfig.tmsLinks,
  swapTestConfig.tags,
);
