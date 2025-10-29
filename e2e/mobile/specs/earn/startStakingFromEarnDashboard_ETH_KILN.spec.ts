import { Provider } from "@ledgerhq/live-common/lib/e2e/enum/Provider";
import { runStartETHStakingFromEarnDashboardTest } from "./earn";

const testConfig = {
  account: Account.ETH_1,
  provider: Provider.KILN,
  tmsLinks: ["B2CQA-3678"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runStartETHStakingFromEarnDashboardTest(
  testConfig.account,
  testConfig.provider,
  testConfig.tmsLinks,
  testConfig.tags,
);

// Temporary disabled due to Kiln not being available
