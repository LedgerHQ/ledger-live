// @flow
import type { CryptoCurrencyIds } from "../types";
import type { EnvName } from "../env";

type EndpointConfig = {
  // define the env name to get the url from. e.g. EXPLORER
  base: EnvName,
  // define the version to use with. e.g. v2, v3
  version: string,
};

type Config = {
  // this is the explorer id of a currency. it is called ticker in explorer's side, but it's not like the coin ticker. it's an ID used only by Ledger's explorer
  id: string,
  // defines the stable endpoint set up to use
  stable: EndpointConfig,
  // if defined, a staging version is available
  experimental?: EndpointConfig,
};

export const explorerConfig: { [id: CryptoCurrencyIds]: ?Config } = {
  bitcoin: {
    id: "btc",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
    experimental: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  bitcoin_cash: {
    id: "abc",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  bitcoin_gold: {
    id: "btg",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  clubcoin: {
    id: "club",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  dash: {
    id: "dash",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  decred: {
    id: "dcr",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  digibyte: {
    id: "dgb",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  dogecoin: {
    id: "doge",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  hcash: {
    id: "hsr",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  komodo: {
    id: "kmd",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  litecoin: {
    id: "ltc",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  peercoin: {
    id: "ppc",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  pivx: {
    id: "pivx",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  poswallet: {
    id: "posw",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  qtum: {
    id: "qtum",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  stakenet: {
    id: "xsn",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  stratis: {
    id: "strat",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  stealthcoin: {
    id: "xst",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  vertcoin: {
    id: "vtc",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  viacoin: {
    id: "via",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  zcash: {
    id: "zec",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  zencash: {
    id: "zen",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
  },
  bitcoin_testnet: {
    id: "btc_testnet",
    stable: {
      base: "EXPLORER",
      version: "v2",
    },
    experimental: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  ethereum: {
    id: "eth",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
    experimental: {
      base: "EXPLORER_BETA",
      version: "v3",
    },
  },
  ethereum_ropsten: {
    id: "eth_ropsten",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  ethereum_classic: {
    id: "etc",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
};
