import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runHotStartTest } from "./earnV2";

const testConfig = {
  account: Account.NEAR_1,
  tmsLinks: ["B2CQA-4720", "B2CQA-4725"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@near", "@family-near"],
};

runHotStartTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
