import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { EarnProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runPartnerDappCTATest } from "./earnV2";

const testConfig = {
  account: Account.ETH_1,
  provider: EarnProvider.KILN,
  // Kiln dapp loads from ledger-staking.widget.kiln.fi/earn inside the platform webview.
  dappUrlSubstring: "ledger-staking.widget.kiln.fi/earn",
  tmsLinks: ["B2CQA-4724"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runPartnerDappCTATest(
  testConfig.account,
  testConfig.provider.name,
  testConfig.dappUrlSubstring,
  testConfig.tmsLinks,
  testConfig.tags,
);
