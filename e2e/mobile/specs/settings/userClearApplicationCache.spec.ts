import { runUserClearApplicationCacheTest } from "./settings";

const testConfig = {
  account: Account.ETH_1,
  tmsLinks: ["B2CQA-826"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runUserClearApplicationCacheTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
