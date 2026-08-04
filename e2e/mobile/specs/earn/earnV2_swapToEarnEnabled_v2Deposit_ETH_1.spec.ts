import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { EarnProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { runSwapToEarnEnabledDepositTest } from "./earnV2";

const testConfig = {
  account: Account.ETH_1,
  // Must be a "liquid" provider: v2 defaults its category filter to liquid below the
  // protocol-staking threshold, and the segmented control has no per-option test id to reset it.
  provider: EarnProvider.STADER_LABS,
  tmsLinks: ["B2CQA-6136"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapToEarnEnabledDepositTest(
  testConfig.account,
  testConfig.provider.name,
  testConfig.tmsLinks,
  testConfig.tags,
);
