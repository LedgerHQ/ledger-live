import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest } from "./earn";

const testConfig = {
  account: Account.SOL_2,
  staking: true,
  tmsLinks: ["B2CQA-3684"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest(
  testConfig.account,
  testConfig.staking,
  testConfig.tmsLinks,
  testConfig.tags,
);
//ok
