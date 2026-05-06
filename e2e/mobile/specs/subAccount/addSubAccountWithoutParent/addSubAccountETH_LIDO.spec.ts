import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: TokenAccount.ETH_LIDO,
  tmslinks: ["B2CQA-2491"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runAddSubAccountTest(testConfig);
