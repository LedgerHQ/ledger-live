import { runSwapLandingPageTest } from "./swap.other";

const transactionE2E = {
  fromAccount: Account.ETH_1,
  toAccount: TokenAccount.ETH_USDC_1,
  tmsLinks: ["B2CQA-2918"],
};

runSwapLandingPageTest(
  transactionE2E.fromAccount,
  transactionE2E.toAccount,
  transactionE2E.tmsLinks,
);
