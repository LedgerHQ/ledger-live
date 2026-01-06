import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: TokenAccount.POL_DAI_1,
  tmslinks: ["B2CQA-2578"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runAddSubAccountTest(testConfig);
