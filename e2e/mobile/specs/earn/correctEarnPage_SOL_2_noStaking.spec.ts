import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest } from "./earn";

const testConfig = {
  account: Account.SOL_2,
  earnButtonId: "7db7743d-3e2f-592b-b3f8-db5916290ec0",
  staking: false,
  tmsLinks: ["B2CQA-3680"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest(
  testConfig.account,
  testConfig.staking,
  testConfig.tmsLinks,
  testConfig.tags,
  testConfig.earnButtonId,
);
