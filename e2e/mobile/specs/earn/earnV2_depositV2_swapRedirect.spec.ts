import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapRedirectTest } from "@e2e/specs/earn/earnV2";

const testConfig = {
  earnAccount: Account.ETH_1,
  fundingAccount: TokenAccount.ETH_USDT_1,
  tmsLinks: [] as string[],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapRedirectTest(
  testConfig.earnAccount,
  testConfig.fundingAccount,
  testConfig.tmsLinks,
  testConfig.tags,
);
