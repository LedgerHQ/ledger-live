import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSelectCryptoNetworkTest } from "./deposit";

const testConfig = {
  account: Account.ETH_1,
  withAccount: true,
  tmsLinks: ["B2CQA-1857"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
};

runSelectCryptoNetworkTest(
  testConfig.account,
  testConfig.withAccount,
  testConfig.tmsLinks,
  testConfig.tags,
);
