import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { EarnProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runStartETHStakingFromEarnDashboardTest } from "./earn";

const testConfig = {
  account: Account.ETH_1,
  provider: EarnProvider.STADER_LABS,
  tmsLinks: ["B2CQA-3677"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum`, `@family-evm`],
};

runStartETHStakingFromEarnDashboardTest(
  testConfig.account,
  testConfig.provider,
  testConfig.tmsLinks,
  testConfig.tags,
);
