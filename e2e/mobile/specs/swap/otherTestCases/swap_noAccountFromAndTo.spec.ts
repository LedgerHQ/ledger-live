import { runSwapWithoutAccountTest } from "@e2e/specs/swap/otherTestCases/swap.other";

const noAccountFromAndToTestConfig = {
  account1: Account.ETH_1,
  account2: Account.BSC_1,
  testTitle: "Swap from account not present to account not present",
  tmsLinks: ["B2CQA-3355"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@bsc",
  ],
};

runSwapWithoutAccountTest({
  asset1: noAccountFromAndToTestConfig.account1,
  asset2: noAccountFromAndToTestConfig.account2,
  testTitle: noAccountFromAndToTestConfig.testTitle,
  tmsLinks: noAccountFromAndToTestConfig.tmsLinks,
  event: "noAccountFromAndTo",
  tags: noAccountFromAndToTestConfig.tags,
});
