import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSelectCryptoWithoutNetworkAndAccountTest } from "./deposit";

const testConfig = {
  account: Account.BTC_LEGACY_1,
  tmsLinks: ["B2CQA-1854"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
};

runSelectCryptoWithoutNetworkAndAccountTest(
  testConfig.account,
  testConfig.tmsLinks,
  testConfig.tags,
);
