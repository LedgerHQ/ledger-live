import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNativeStakingCTATest } from "./earnV2";

const testConfig = {
  account: Account.SOL_2,
  tmsLinks: ["B2CQA-4643"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
};

runNativeStakingCTATest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
