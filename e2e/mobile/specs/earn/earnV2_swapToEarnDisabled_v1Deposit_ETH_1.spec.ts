import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapToEarnDisabledDepositTest } from "./earnV2";

const testConfig = {
  account: Account.ETH_1,
  tmsLinks: ["B2CQA-6136"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runSwapToEarnDisabledDepositTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
