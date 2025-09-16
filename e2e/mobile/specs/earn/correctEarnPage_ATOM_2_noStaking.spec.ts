import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest } from "./earn";

const testConfig = {
  account: Account.ATOM_2,
  earnButtonId: "68498e12-87ba-5dad-9724-6063597ae8b3",
  staking: false,
  tmsLinks: ["B2CQA-3681"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest(
  testConfig.account,
  testConfig.staking,
  testConfig.tmsLinks,
  testConfig.tags,
  testConfig.earnButtonId,
);
