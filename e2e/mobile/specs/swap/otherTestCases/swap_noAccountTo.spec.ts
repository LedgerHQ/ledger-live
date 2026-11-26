import { runSwapWithoutAccountTest } from "@e2e/specs/swap/otherTestCases/swap.other";

const noAccountToTestConfig = {
  account1: Account.ETH_1,
  account2: Account.BTC_NATIVE_SEGWIT_1,
  testTitle: "Swap from account present to account not present",
  tmsLinks: ["B2CQA-3354"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@bitcoin",
    "@family-bitcoin",
  ],
};

runSwapWithoutAccountTest({
  asset1: noAccountToTestConfig.account1,
  asset2: noAccountToTestConfig.account2,
  testTitle: noAccountToTestConfig.testTitle,
  tmsLinks: noAccountToTestConfig.tmsLinks,
  event: "noAccountTo",
  tags: noAccountToTestConfig.tags,
});
