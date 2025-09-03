import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest } from "./earn";

const testConfig = {
  account: Account.NEAR_2,
  earnButtonId: "4969e17f-213a-5180-809b-ee16abe3f400",
  staking: false,
  tmsLinks: ["B2CQA-3682"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest(
  testConfig.account,
  testConfig.staking,
  testConfig.tmsLinks,
  testConfig.tags,
  testConfig.earnButtonId,
);
