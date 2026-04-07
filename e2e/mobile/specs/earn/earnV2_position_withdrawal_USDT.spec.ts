import { TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { runPositionToWithdrawalTest } from "./earnV2";

const testConfig = {
  account: TokenAccount.ETH_USDT_1,
  tmsLinks: ["B2CQA-4648"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runPositionToWithdrawalTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
