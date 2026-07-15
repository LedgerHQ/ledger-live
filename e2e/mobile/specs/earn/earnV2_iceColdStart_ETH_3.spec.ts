import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runIceColdStartTest } from "./earnV2";

const testConfig = {
  account: Account.ETH_3,
  tmsLinks: ["B2CQA-4639"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runIceColdStartTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
