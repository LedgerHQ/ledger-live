import { runAddSubAccountTest } from "../addAccount";

const testConfig = {
  account: TokenAccount.ETH_USDT_2,
  tmslinks: ["B2CQA-2492"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
