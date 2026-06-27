import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSelectCryptoNetworkTest } from "./deposit";
import { assetAvailableNetworks } from "@ledgerhq/live-e2e-shared/data/assetsDrawer";

const testConfig = {
  account: Account.ETH_1,
  networks: assetAvailableNetworks.ETH.networks,
  withAccount: false,
  tmsLinks: ["B2CQA-1855"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum`, `@family-evm`],
};

runSelectCryptoNetworkTest(
  testConfig.account,
  testConfig.networks,
  testConfig.withAccount,
  testConfig.tmsLinks,
  testConfig.tags,
);
