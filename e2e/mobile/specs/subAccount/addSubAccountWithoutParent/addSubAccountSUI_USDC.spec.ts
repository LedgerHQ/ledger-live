import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: TokenAccount.SUI_USDC_1,
  tmslinks: ["B2CQA-3904"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@sui", "@family-sui"],
};

runAddSubAccountTest(testConfig);
