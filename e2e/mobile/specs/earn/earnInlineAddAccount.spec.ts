import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runInlineAddAccountTest } from "@e2e/specs/earn/earnV2";

const testConfig = {
  account: Account.ETH_1,
  tmsLinks: ["B2CQA-3001"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runInlineAddAccountTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
