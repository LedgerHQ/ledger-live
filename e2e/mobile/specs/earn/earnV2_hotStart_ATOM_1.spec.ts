import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runHotStartTest } from "@e2e/specs/earn/earnV2";

const testConfig = {
  account: Account.ATOM_1,
  tmsLinks: ["B2CQA-4721", "B2CQA-4726"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@cosmos", "@family-cosmos"],
};

runHotStartTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
