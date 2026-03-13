import { runAddSubAccountTest } from "../subAccount";
import { assetAvailableNetworks } from "@ledgerhq/live-common/e2e/data/assetsDrawer";

const testConfig = {
  asset: TokenAccount.ETH_USDT_1,
  tmslinks: ["B2CQA-2577", "B2CQA-1079", "B2CQA-1857"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
  networks: assetAvailableNetworks.USDT.networks,
};

runAddSubAccountTest(testConfig);
