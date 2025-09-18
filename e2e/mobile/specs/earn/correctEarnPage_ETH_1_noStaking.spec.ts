import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest } from "./earn";

const testConfig = {
  account: Account.ETH_1,
  earnButtonId: "3bd9fab1-fb6c-5fc2-a8b6-a1d810365b1e",
  staking: false,
  tmsLinks: ["B2CQA-3679"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest(
  testConfig.account,
  testConfig.staking,
  testConfig.tmsLinks,
  testConfig.tags,
  testConfig.earnButtonId,
);
