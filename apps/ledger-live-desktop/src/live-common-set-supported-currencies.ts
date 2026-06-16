import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";

setWalletAPIVersion(WALLET_API_VERSION);
registerAllCoins();
