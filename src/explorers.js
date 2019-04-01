// @flow

import type { Account, CryptoCurrency, Operation, ExplorerView } from "./types";
import invariant from "invariant";
import { getEnv } from "./env";

export const getDefaultExplorerView = (
  currency: CryptoCurrency
): ?ExplorerView => currency.explorerViews[0];

export const getTransactionExplorer = (
  explorerView: ?ExplorerView,
  txHash: string
): ?string =>
  explorerView && explorerView.tx && explorerView.tx.replace("$hash", txHash);

export const getAddressExplorer = (
  explorerView: ?ExplorerView,
  address: string
): ?string =>
  explorerView &&
  explorerView.address &&
  explorerView.address.replace("$address", address);

// NB deprecated & should be replaced by using directly the other functions
export const getAccountOperationExplorer = (
  account: Account,
  operation: Operation
): ?string =>
  getTransactionExplorer(
    getDefaultExplorerView(account.currency),
    operation.hash
  );

export const hasCurrencyExplorer = (currency: CryptoCurrency): boolean => {
  return !!ledgerExplorers[currency.id];
};

export const getCurrencyExplorer = (currency: CryptoCurrency) => {
  invariant(
    typeof ledgerExplorers[currency.id] === "object",
    `ledgerExplorers: we have no record of a ledger explorer for ${currency.id}`
  );

  const experimentalExplorers = getEnv("EXPERIMENTAL_EXPLORERS");
  let explorerKey = "default";

  if (experimentalExplorers && ledgerExplorers[currency.id]["experimental"]) {
      explorerKey = "experimental";
  }

  return ledgerExplorers[currency.id][explorerKey];
};

const ledgerExplorers = {
  bitcoin: {
    default: {
      id: "btc",
      version: "v2"
    }
  },
  bitcoin_cash: {
    default: {
      id: "abc",
      version: "v2"
    }
  },
  bitcoin_gold: {
    default: {
      id: "btg",
      version: "v2"
    }
  },
  clubcoin: {
    default: {
      id: "club",
      version: "v2"
    }
  },
  dash: {
    default: {
      id: "dash",
      version: "v2"
    }
  },
  decred: {
    default: {
      id: "dcr",
      version: "v2"
    }
  },
  digibyte: {
    default: {
      id: "dgb",
      version: "v2"
    }
  },
  dogecoin: {
    default: {
      id: "doge",
      version: "v2"
    }
  },
  ethereum: {
    default: {
      id: "eth",
      version: "v2"
    },
    experimental: {
      id: "eth-mainnet",
      version: "v3"
    }
  },
  ethereum_classic: {
    default: {
      id: "ethc",
      version: "v2"
    }
  },
  hcash: {
    default: {
      id: "hsr",
      version: "v2"
    }
  },
  komodo: {
    default: {
      id: "kmd",
      version: "v2"
    }
  },
  litecoin: {
    default: {
      id: "ltc",
      version: "v2"
    }
  },
  peercoin: {
    default: {
      id: "ppc",
      version: "v2"
    }
  },
  pivx: {
    default: {
      id: "pivx",
      version: "v2"
    }
  },
  poswallet: {
    default: {
      id: "posw",
      version: "v2"
    }
  },
  qtum: {
    default: {
      id: "qtum",
      version: "v2"
    }
  },
  stakenet: {
    default: {
      id: "xsn",
      version: "v2"
    }
  },
  stratis: {
    default: {
      id: "strat",
      version: "v2"
    }
  },
  stealthcoin: {
    default: {
      id: "xst",
      version: "v2"
    }
  },
  vertcoin: {
    default: {
      id: "vtc",
      version: "v2"
    }
  },
  viacoin: {
    default: {
      id: "via",
      version: "v2"
    }
  },
  zcash: {
    default: {
      id: "zec",
      version: "v2"
    }
  },
  zencash: {
    default: {
      id: "zen",
      version: "v2"
    }
  },

  // Testnets
  bitcoin_testnet: {
    default: {
      id: "btc_testnet",
      version: "v2"
    }
  },
  ethereum_ropsten: {
    default: {
      id: "eth-ropsten",
      version: "v3"
    }
  }
};
