import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  account: Account.BSC_SHIBA,
  tmslinks: ["B2CQA-2490"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
