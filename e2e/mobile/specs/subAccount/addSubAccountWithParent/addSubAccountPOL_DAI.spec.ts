import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  account: TokenAccount.POL_DAI_1,
  tmslinks: ["B2CQA-2493"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
