import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runScyStakingCTATest } from "./earnV2";

const testConfig = {
  account: TokenAccount.ETH_USDT_1,
  tmsLinks: ["B2CQA-4645"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runScyStakingCTATest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
