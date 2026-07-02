import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runColdStartTest } from "./earnV2";

const testConfig = {
  account: Account.ETH_2,
  tmsLinks: ["B2CQA-4640"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runColdStartTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
