import "./live-common-setup-network";
import { setSupportedCurrencies } from "@ledgerhq/coin-framework/currencies/support";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";

LiveConfig.setConfig(liveConfig);
LiveConfig.setAppinfo({
  platform: "web",
});

setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies([
  "axelar",
  "stargaze",
  "secret_network",
  "umee",
  "desmos",
  "dydx",
  "onomy",
  "sei_network",
  "quicksilver",
  "persistence",
  "bitcoin",
  "ethereum",
  "bsc",
  "polkadot",
  "ripple",
  "litecoin",
  "polygon",
  "bitcoin_cash",
  "stellar",
  "dogecoin",
  "cosmos",
  "dash",
  "tron",
  "tezos",
  "elrond",
  "ethereum_classic",
  "zcash",
  "decred",
  "digibyte",
  "algorand",
  "qtum",
  "bitcoin_gold",
  "komodo",
  "zencash",
  "bitcoin_testnet",
  "ethereum_sepolia",
  "ethereum_holesky",
  "crypto_org",
  "crypto_org_cosmos",
  "crypto_org_croeseid",
  "celo",
  "hedera",
  "cardano",
  "solana",
  "osmosis",
  "fantom",
  "moonbeam",
  "cronos",
  "songbird",
  "flare",
  "near",
  "coreum",
  "vechain",
  "optimism",
  "optimism_sepolia",
  "linea",
  "linea_sepolia",
  "mantra",
]);
