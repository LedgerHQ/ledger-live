import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  account: TokenAccount.ETH_LIDO,
  tmslinks: ["B2CQA-2491"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
