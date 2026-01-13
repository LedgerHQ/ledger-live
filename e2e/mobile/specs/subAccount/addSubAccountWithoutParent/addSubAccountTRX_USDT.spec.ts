import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: TokenAccount.TRX_USDT,
  tmslinks: ["B2CQA-2580"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  withParentAccount: false,
};

runAddSubAccountTest(
  testConfig.asset,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
