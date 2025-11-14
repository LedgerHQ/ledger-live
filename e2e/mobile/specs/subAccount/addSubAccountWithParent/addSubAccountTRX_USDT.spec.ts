import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  account: Account.TRX_USDT,
  tmslinks: ["B2CQA-2496"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
  withParentAccount: true,
};

runAddSubAccountTest(
  testConfig.account,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
