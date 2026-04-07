import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runColdStartTest } from "./earnV2";

const testConfig = {
  account: Account.ETH_2,
  tmsLinks: ["B2CQA-XXXX"], // TODO: replace with actual Xray ticket ID
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runColdStartTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
