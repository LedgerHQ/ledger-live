import { registerAllCoins } from "@ledgerhq/live-common/coin-modules/load-all-coins";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { setLocalNodeCurrencies } from "@ledgerhq/live-common/localNode/index";
import { LOCAL_NODE_CURRENCIES } from "~/localNode";

setWalletAPIVersion(WALLET_API_VERSION);
registerAllCoins();
setLocalNodeCurrencies(LOCAL_NODE_CURRENCIES);
