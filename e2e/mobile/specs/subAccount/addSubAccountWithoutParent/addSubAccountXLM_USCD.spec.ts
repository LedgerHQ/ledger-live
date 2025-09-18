import { runAddSubAccountTest } from "../subAccount";

const testConfig = {
  asset: Account.XLM_USCD,
  tmslinks: ["B2CQA-2579"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
  withParentAccount: false,
};

runAddSubAccountTest(
  testConfig.asset,
  testConfig.tmslinks,
  testConfig.tags,
  testConfig.withParentAccount,
);
