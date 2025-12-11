import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: Account.POL_DAI_1,
  tmslinks: ["B2CQA-2578"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  withParentAccount: false,
};

runAddSubAccountTest(
  testConfig.asset,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
