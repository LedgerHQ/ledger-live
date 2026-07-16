import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runHotStartTest } from "./earnV2";

const testConfig = {
  account: Account.SOL_2,
  tmsLinks: ["B2CQA-4641", "B2CQA-4646"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
};

runHotStartTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
