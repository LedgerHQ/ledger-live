import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runColdStartTest } from "./earnV2";

const testConfig = {
  account: Account.ATOM_2,
  tmsLinks: ["B2CQA-4719"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
};

runColdStartTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
