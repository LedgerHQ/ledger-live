import { runInlineAddAccountTest } from "./earn";

const testConfig = {
  account: Account.ETH_1,
  tmsLinks: ["B2CQA-3001"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runInlineAddAccountTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
