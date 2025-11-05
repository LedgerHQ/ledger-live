import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest } from "./earn";

const testConfig = {
  account: Account.NEAR_2,
  staking: false,
  tmsLinks: ["B2CQA-3682"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest(
  testConfig.account,
  testConfig.staking,
  testConfig.tmsLinks,
  testConfig.tags,
);
