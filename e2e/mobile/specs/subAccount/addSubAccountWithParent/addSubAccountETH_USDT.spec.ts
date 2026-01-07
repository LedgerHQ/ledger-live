import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  account: TokenAccount.ETH_USDT_1,
  tmslinks: ["B2CQA-2492"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
