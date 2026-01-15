import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: TokenAccount.ALGO_USDT_1,
  tmslinks: ["B2CQA-2575"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runAddSubAccountTest(testConfig);
