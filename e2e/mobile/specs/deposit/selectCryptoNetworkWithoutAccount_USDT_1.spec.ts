import { assetAvailableNetworks } from "@ledgerhq/live-common/lib/e2e/data/assetsDrawer";
import { runSelectCryptoNetworkTest } from "./deposit";

const testConfig = {
  account: TokenAccount.ETH_USDT_1,
  networks: assetAvailableNetworks.USDT.networks,
  withAccount: false,
  tmsLinks: ["B2CQA-1855"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSelectCryptoNetworkTest(
  testConfig.account,
  testConfig.networks,
  testConfig.withAccount,
  testConfig.tmsLinks,
  testConfig.tags,
);
