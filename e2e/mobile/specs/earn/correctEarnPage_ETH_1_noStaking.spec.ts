import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest } from "./earn";

const testConfig = {
  account: Account.ETH_1,
  staking: false,
  tmsLinks: ["B2CQA-3679"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest(
  testConfig.account,
  testConfig.staking,
  testConfig.tmsLinks,
  testConfig.tags,
);
