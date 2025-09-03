import { Provider } from "@ledgerhq/live-common/lib/e2e/enum/Provider";
import { runStartETHStakingFromEarnDashboardTest } from "./earn";

const testConfig = {
  account: Account.ETH_1,
  earnButtonId: "3bd9fab1-fb6c-5fc2-a8b6-a1d810365b1e",
  provider: Provider.LIDO,
  tmsLinks: ["B2CQA-3676, B2CQA-1713"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runStartETHStakingFromEarnDashboardTest(
  testConfig.account,
  testConfig.earnButtonId,
  testConfig.provider,
  testConfig.tmsLinks,
  testConfig.tags,
);
