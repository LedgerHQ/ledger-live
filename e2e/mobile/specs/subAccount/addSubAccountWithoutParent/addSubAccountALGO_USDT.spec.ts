import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: Account.ALGO_USDT_1,
  tmslinks: ["B2CQA-2575"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
  withParentAccount: false,
};

runAddSubAccountTest(
  testConfig.asset,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
