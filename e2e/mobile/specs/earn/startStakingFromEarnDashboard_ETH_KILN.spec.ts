import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { EarnProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runStartETHStakingFromEarnDashboardTest } from "./earn";

const testConfig = {
  account: Account.ETH_1,
  provider: EarnProvider.KILN,
  tmsLinks: ["B2CQA-3678"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum`, `@family-evm`],
};

runStartETHStakingFromEarnDashboardTest(
  testConfig.account,
  testConfig.provider,
  testConfig.tmsLinks,
  testConfig.tags,
);
