import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  account: Account.POL_UNI,
  tmslinks: ["B2CQA-2494"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
