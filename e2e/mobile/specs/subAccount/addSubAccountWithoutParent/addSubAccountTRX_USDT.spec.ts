import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: Account.TRX_USDT,
  tmslinks: ["B2CQA-2580"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
  withParentAccount: false,
};

runAddSubAccountTest(
  testConfig.asset,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);

//ok
