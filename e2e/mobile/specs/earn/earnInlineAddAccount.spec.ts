import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runInlineAddAccountTest } from "./earnV2";

const testConfig = {
  account: Account.ETH_1,
  tmsLinks: ["B2CQA-3001"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runInlineAddAccountTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
