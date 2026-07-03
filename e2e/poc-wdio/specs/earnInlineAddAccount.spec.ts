import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

import { runInlineAddAccountTest } from "./earn.test.ts";

const testConfig = {
  account: Account.ETH_1,
  tmsLinks: ["B2CQA-3001"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

describe("Earn V2 - Inline Add Account", () => {
  it(`Inline Add Account [${testConfig.account.currency.speculosApp.name}]`, async () => {
    await runInlineAddAccountTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
  });
});
