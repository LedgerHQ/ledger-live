import { runAddSubAccountTest } from "@e2e/specs/subAccount/subAccount";
import { assetAvailableNetworks } from "@ledgerhq/live-e2e-shared/data/assetsDrawer";

const testConfig = {
  asset: TokenAccount.ETH_USDT_1,
  tmslinks: ["B2CQA-2577"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
  networks: assetAvailableNetworks.USDT.networks,
};

runAddSubAccountTest(testConfig);
