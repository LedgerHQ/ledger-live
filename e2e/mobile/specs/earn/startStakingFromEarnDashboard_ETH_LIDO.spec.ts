import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Provider } from "@ledgerhq/live-common/lib/e2e/enum/Provider";
import { runStartETHStakingFromEarnDashboardTest } from "./earn";

const testConfig = {
  account: Account.ETH_1,
  provider: Provider.LIDO,
  tmsLinks: ["B2CQA-3676, B2CQA-1713"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runStartETHStakingFromEarnDashboardTest(
  testConfig.account,
  testConfig.provider,
  testConfig.tmsLinks,
  testConfig.tags,
);
