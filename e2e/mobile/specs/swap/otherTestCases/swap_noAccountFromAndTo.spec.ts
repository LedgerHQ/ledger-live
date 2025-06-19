import { runSwapWithoutAccountTest } from "./swap.other";

const noAccountFromAndToTestConfig = {
  account1: Account.ETH_1,
  account2: Account.BSC_1,
  testTitle: "from Account not present to Account not present",
  tmsLinks: ["B2CQA-3355"],
};

runSwapWithoutAccountTest(
  noAccountFromAndToTestConfig.account1,
  noAccountFromAndToTestConfig.account2,
  noAccountFromAndToTestConfig.testTitle,
  noAccountFromAndToTestConfig.tmsLinks,
  "noAccountFromAndTo",
);
