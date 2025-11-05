import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCreateNewAccountAndDepositTest } from "./deposit";

const testConfig = {
  currentAccount: Account.XRP_1,
  newAccount: Account.XRP_2,
  tmsLinks: ["B2CQA-1861"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runCreateNewAccountAndDepositTest(
  testConfig.currentAccount,
  testConfig.newAccount,
  testConfig.tmsLinks,
  testConfig.tags,
);
