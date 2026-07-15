import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSelectCryptoWithoutNetworkAndAccountTest } from "./deposit";

const testConfig = {
  account: Account.BTC_NATIVE_SEGWIT_1,
  tmsLinks: ["B2CQA-1854"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bitcoin", "@family-bitcoin"],
};

runSelectCryptoWithoutNetworkAndAccountTest(
  testConfig.account,
  testConfig.tmsLinks,
  testConfig.tags,
);
