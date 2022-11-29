import { log } from "@ledgerhq/logs";
import network from "../../network";
import type { FullConfig, FullConfigOverrides } from "./types";
import { asFullConfigOverrides, applyFullConfigOverrides } from "./overrides";

const initialExplorerConfig: FullConfig = {
  bitcoin: {
    id: "btc",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  bitcoin_cash: {
    id: "bch",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  bitcoin_gold: {
    id: "btg",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  // FIXME Doesn't seem supported, should we remove?
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
      version: "v3",
    },
  },
  decred: {
    id: "dcr",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  digibyte: {
    id: "dgb",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  dogecoin: {
    id: "doge",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  // FIXME Doesn't seem supported, should we remove?
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
      version: "v3",
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
      version: "v3",
    },
  },
  pivx: {
    id: "pivx",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  // FIXME Doesn't seem supported, should we remove?
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
      version: "v3",
    },
  },
  stakenet: {
    id: "xsn",
    stable: {
      base: "EXPLORER",
      version: "v3",
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
      version: "v3",
    },
  },
  viacoin: {
    id: "via",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  zcash: {
    id: "zec",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  zencash: {
    id: "zen",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  bitcoin_testnet: {
    id: "btc_testnet",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  bsc: {
    id: "bnb",
    stable: {
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
  },
  ethereum_ropsten: {
    id: "eth_ropsten",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
  ethereum_goerli: {
    id: "eth_goerli",
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
  polygon: {
    id: "matic",
    stable: {
      base: "EXPLORER",
      version: "v3",
    },
  },
};
let explorerConfig: FullConfig = initialExplorerConfig;
export function getExplorerConfig(): FullConfig {
  return explorerConfig;
}
// these two function follows the same principle of CurrencyBridge's preload & hydrate
// and for this current PoC will be only used by the bitcoin family
// if we want in future to generalize it to all family, we would need to adapt this.
let cacheConfig:
  | {
      timestamp: number;
      config: FullConfigOverrides;
    }
  | null
  | undefined = null;
export const preload = async (): Promise<
  FullConfigOverrides | null | undefined
> => {
  if (cacheConfig && Date.now() - cacheConfig.timestamp < 60 * 1000) {
    return cacheConfig.config;
  }

  const { data } = await network({
    url: "https://cdn.live.ledger.com/config/explorerConfig.v1.json",
    method: "GET",
  });

  try {
    const config = asFullConfigOverrides(data);
    cacheConfig = {
      timestamp: Date.now(),
      config,
    };
    return config;
  } catch (e) {
    log("explorerConfig", "failed to load explorerConfig: " + e);
  }
};

export const hydrate = (maybeConfig?: Record<string, any>): void => {
  if (!maybeConfig) return;
  let safe;

  try {
    safe = asFullConfigOverrides(maybeConfig);
  } catch (e) {
    log("explorerConfig", "failed to hydrate explorerConfig: " + e);
  }

  if (!safe) return;
  // update explorerConfig with remote config
  explorerConfig = applyFullConfigOverrides(initialExplorerConfig, safe);
};
