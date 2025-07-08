import { runAddSubAccountTest } from "../addAccount";

const testConfig = {
  account: Account.BSC_BUSD_2,
  tmslinks: ["B2CQA-2489"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
