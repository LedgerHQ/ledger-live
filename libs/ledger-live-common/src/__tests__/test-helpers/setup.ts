import BigNumber from "bignumber.js";
import { setSupportedCurrencies } from "../../currencies";
import { setPlatformVersion } from "../../platform/version";

jest.setTimeout(360000);

expect.extend({
  toBeBigNumber(value) {
    const pass = BigNumber.isBigNumber(value);
    const message = pass
      ? () => `${value} is a BigNumber`
      : () => `${value} is not a BigNumber`;

    return { message, pass };
  },
});

setPlatformVersion("0.0.1");

setSupportedCurrencies([
  "bitcoin",
  "ethereum",
  "bsc",
  "polygon",
  "elrond",
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
  "ethereum_goerli",
  "cosmos_testnet",
  "crypto_org_croeseid",
  "crypto_org",
  "filecoin",
  "solana",
  "celo",
  "hedera",
]);
