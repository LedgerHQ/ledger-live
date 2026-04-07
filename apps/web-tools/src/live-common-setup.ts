import "./live-common-setup-network";
import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

LiveConfig.setConfig(liveConfig);
LiveConfig.setAppinfo({
  platform: "web",
});

setWalletAPIVersion(WALLET_API_VERSION);

registerAllCoins();

export function setupCryptoAssetsStore(): void {
  // for now we use the test-helpers one
  setupCalClientStore();
}

setupCryptoAssetsStore();
