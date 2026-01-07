import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { assetAvailableNetworks } from "@ledgerhq/live-common/e2e/data/assetsDrawer";
import { runSelectCryptoNetworkTest } from "./deposit";

const testConfig = {
  account: Account.ETH_1,
  networks: assetAvailableNetworks.ETH.networks,
  withAccount: true,
  tmsLinks: ["B2CQA-1857"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSelectCryptoNetworkTest(
  testConfig.account,
  testConfig.networks,
  testConfig.withAccount,
  testConfig.tmsLinks,
  testConfig.tags,
);
