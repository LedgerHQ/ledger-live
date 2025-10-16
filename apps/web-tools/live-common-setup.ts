import "./live-common-setup-network";
import { setSupportedCurrencies } from "@ledgerhq/coin-framework/currencies/support";
import { setWalletAPIVersion } from "@ledgerhq/live-common/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { toCryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

LiveConfig.setConfig(liveConfig);
LiveConfig.setAppinfo({
  platform: "web",
});

setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies([
  toCryptoCurrencyId("axelar"),
  toCryptoCurrencyId("stargaze"),
  toCryptoCurrencyId("secret_network"),
  toCryptoCurrencyId("umee"),
  toCryptoCurrencyId("desmos"),
  toCryptoCurrencyId("dydx"),
  toCryptoCurrencyId("onomy"),
  toCryptoCurrencyId("sei_network"),
  toCryptoCurrencyId("quicksilver"),
  toCryptoCurrencyId("persistence"),
  toCryptoCurrencyId("bitcoin"),
  toCryptoCurrencyId("ethereum"),
  toCryptoCurrencyId("bsc"),
  toCryptoCurrencyId("polkadot"),
  toCryptoCurrencyId("ripple"),
  toCryptoCurrencyId("litecoin"),
  toCryptoCurrencyId("polygon"),
  toCryptoCurrencyId("bitcoin_cash"),
  toCryptoCurrencyId("stellar"),
  toCryptoCurrencyId("dogecoin"),
  toCryptoCurrencyId("cosmos"),
  toCryptoCurrencyId("dash"),
  toCryptoCurrencyId("tron"),
  toCryptoCurrencyId("tezos"),
  toCryptoCurrencyId("elrond"), // NOTE: legacy 'multiversx' name, kept for compatibility
  toCryptoCurrencyId("ethereum_classic"),
  toCryptoCurrencyId("zcash"),
  toCryptoCurrencyId("decred"),
  toCryptoCurrencyId("digibyte"),
  toCryptoCurrencyId("algorand"),
  toCryptoCurrencyId("qtum"),
  toCryptoCurrencyId("bitcoin_gold"),
  toCryptoCurrencyId("komodo"),
  toCryptoCurrencyId("zencash"),
  toCryptoCurrencyId("bitcoin_testnet"),
  toCryptoCurrencyId("ethereum_sepolia"),
  toCryptoCurrencyId("ethereum_holesky"),
  toCryptoCurrencyId("crypto_org"),
  toCryptoCurrencyId("crypto_org_croeseid"),
  toCryptoCurrencyId("celo"),
  toCryptoCurrencyId("hedera"),
  toCryptoCurrencyId("cardano"),
  toCryptoCurrencyId("solana"),
  toCryptoCurrencyId("osmosis"),
  toCryptoCurrencyId("fantom"),
  toCryptoCurrencyId("moonbeam"),
  toCryptoCurrencyId("cronos"),
  toCryptoCurrencyId("songbird"),
  toCryptoCurrencyId("flare"),
  toCryptoCurrencyId("near"),
  toCryptoCurrencyId("coreum"),
  toCryptoCurrencyId("vechain"),
  toCryptoCurrencyId("optimism"),
  toCryptoCurrencyId("optimism_sepolia"),
  toCryptoCurrencyId("linea"),
  toCryptoCurrencyId("linea_sepolia"),
  toCryptoCurrencyId("mantra"),
  toCryptoCurrencyId("xion"),
  toCryptoCurrencyId("zenrock"),
  toCryptoCurrencyId("sui"),
  toCryptoCurrencyId("mina"),
  toCryptoCurrencyId("babylon"),
  toCryptoCurrencyId("kaspa"),
  toCryptoCurrencyId("westend"),
  toCryptoCurrencyId("assethub_westend"),
  toCryptoCurrencyId("assethub_polkadot"),
]);
