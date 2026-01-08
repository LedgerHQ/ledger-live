import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: TokenAccount.XLM_USCD,
  tmslinks: ["B2CQA-2579"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runAddSubAccountTest(testConfig);
