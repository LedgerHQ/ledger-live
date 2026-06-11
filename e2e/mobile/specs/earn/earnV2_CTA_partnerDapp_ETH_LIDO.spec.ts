import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { EarnProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { runPartnerDappCTATest } from "./earnV2";

const testConfig = {
  account: Account.ETH_1,
  provider: EarnProvider.LIDO,
  // Lido dapp loads from stake.lido.fi inside the platform webview.
  dappUrlSubstring: "stake.lido.fi",
  tmsLinks: ["B2CQA-4722", "B2CQA-4644"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runPartnerDappCTATest(
  testConfig.account,
  testConfig.provider.name,
  testConfig.dappUrlSubstring,
  testConfig.tmsLinks,
  testConfig.tags,
);
