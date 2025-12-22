import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDepositInExistingAccountTest } from "./deposit";

const testConfig = {
  account: Account.ETH_1,
  networkName: "ethereum",
  tmsLinks: ["B2CQA-1898"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runDepositInExistingAccountTest(
  testConfig.account,
  testConfig.networkName,
  testConfig.tmsLinks,
  testConfig.tags,
);
