import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { EarnProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { runPartnerDappCTATest } from "./earnV2";

const testConfig = {
  account: Account.ETH_1,
  provider: EarnProvider.STADER_LABS,
  // Stader Labs dapp loads from staderlabs.com/{ticker} inside the platform webview.
  dappUrlSubstring: `staderlabs.com/${Account.ETH_1.currency.ticker}`,
  tmsLinks: ["B2CQA-4723"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runPartnerDappCTATest(
  testConfig.account,
  testConfig.provider.name,
  testConfig.dappUrlSubstring,
  testConfig.tmsLinks,
  testConfig.tags,
);
