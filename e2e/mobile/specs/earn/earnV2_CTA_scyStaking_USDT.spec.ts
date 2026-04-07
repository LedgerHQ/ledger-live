import { TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { runScyStakingCTATest } from "./earnV2";

const testConfig = {
  account: TokenAccount.ETH_USDT_1,
  tmsLinks: ["B2CQA-XXXX"], // TODO: replace with actual Xray ticket ID
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runScyStakingCTATest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
