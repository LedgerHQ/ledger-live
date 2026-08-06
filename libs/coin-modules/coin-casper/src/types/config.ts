import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type CasperCoinConfig = () => CurrencyConfig & {
  infra: {
    API_CASPER_NODE_ENDPOINT: string;
    API_CASPER_INDEXER: string;
  };
};
