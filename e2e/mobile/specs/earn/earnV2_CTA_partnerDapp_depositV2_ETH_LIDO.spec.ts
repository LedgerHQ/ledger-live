import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { EarnProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { runPartnerDappCTATest } from "@e2e/specs/earn/earnV2";

const testConfig = {
  account: Account.ETH_1,
  provider: EarnProvider.LIDO,
  dappUrlSubstring: "stake.lido.fi",
  tmsLinks: [],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runPartnerDappCTATest(
  testConfig.account,
  testConfig.provider.name,
  testConfig.dappUrlSubstring,
  testConfig.tmsLinks,
  testConfig.tags,
  { preset: "50" },
);
