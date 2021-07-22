import { setSupportedCurrencies } from "../../currencies";
import { setPlatformVersion } from "../../platform/version";

jest.setTimeout(180000);

setPlatformVersion("0.0.1");

setSupportedCurrencies([
  "bitcoin",
  "ethereum",
  "bsc",
  "ripple",
  "bitcoin_cash",
  "litecoin",
  "dash",
  "ethereum_classic",
  "tezos",
  "qtum",
  "zcash",
  "bitcoin_gold",
  "stratis",
  "dogecoin",
  "digibyte",
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stakenet",
  "stealthcoin",
  "decred",
  "tron",
  "stellar",
  "cosmos",
  "algorand",
  "polkadot",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "cosmos_testnet",
]);
