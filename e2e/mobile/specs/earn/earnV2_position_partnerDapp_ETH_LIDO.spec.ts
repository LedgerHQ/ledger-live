import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runPartnerDappPositionTest } from "./earnV2";

const testConfig = {
  account: Account.ETH_1,
  // Tapping "Manage" opens ledgerlive://discover/lido which routes internally
  // to the PlatformApp screen and loads the Lido dapp webview.
  dappUrlSubstring: "lido.fi",
  tmsLinks: ["B2CQA-4647"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runPartnerDappPositionTest(
  testConfig.account,
  testConfig.dappUrlSubstring,
  testConfig.tmsLinks,
  testConfig.tags,
);
