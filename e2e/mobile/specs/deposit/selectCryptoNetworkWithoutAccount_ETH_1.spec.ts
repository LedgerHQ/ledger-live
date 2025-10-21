import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSelectCryptoNetworkTest } from "./deposit";

const testConfig = {
  account: Account.ETH_1,
  withAccount: false,
  tmsLinks: ["B2CQA-1855"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runSelectCryptoNetworkTest(
  testConfig.account,
  testConfig.withAccount,
  testConfig.tmsLinks,
  testConfig.tags,
);
