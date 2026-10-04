import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runColdStartTest } from "@e2e/specs/earn/earnV2";

const testConfig = {
  account: Account.ETH_2,
  tmsLinks: [],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runColdStartTest(testConfig.account, testConfig.tmsLinks, testConfig.tags, "v2");
