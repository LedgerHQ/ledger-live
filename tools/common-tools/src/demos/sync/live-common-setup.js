// @flow
import { setSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies/index";
import { setPlatformVersion } from "@ledgerhq/live-common/lib/platform/version";
import { PLATFORM_VERSION } from "@ledgerhq/live-common/lib/platform/constants";
import { setWalletAPIVersion } from "@ledgerhq/live-common/lib/wallet-api/version";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/lib/wallet-api/constants";

setPlatformVersion(PLATFORM_VERSION);
setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies([
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
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "ethereum_goerli",
  "crypto_org",
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
]);
