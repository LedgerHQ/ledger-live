import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: Account.BSC_BUSD_1,
  tmslinks: ["B2CQA-2576"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
  withParentAccount: false,
};
runAddSubAccountTest(
  testConfig.asset,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
