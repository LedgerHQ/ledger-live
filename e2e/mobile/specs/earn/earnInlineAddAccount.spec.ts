import { runInlineAddAccountTest } from "./earnV2";

const testConfig = {
  account: Account.ETH_1,
  tmsLinks: ["B2CQA-3001"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@smoke",
    "@ethereum",
    "@family-evm",
  ],
};

runInlineAddAccountTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
