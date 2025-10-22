import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  account: Account.POL_DAI_1,
  tmslinks: ["B2CQA-2493"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
