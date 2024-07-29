import { MissingCoinConfig } from "./errors";

type ConfigStatus =
  | {
      type: "active";
    }
  | {
      type: "under_maintenance";
      message?: string;
    }
  | {
      type: "will_be_deprecated";
      deprecated_date: string;
    }
  | {
      type: "deprecated";
    };

export type CurrencyConfig = {
  status: ConfigStatus;
  [key: string]: unknown;
};

export type CoinConfig<T extends CurrencyConfig> = () => T;

function buildCoinConfig<T extends CurrencyConfig>() {
  let coinConfig: CoinConfig<T> | undefined;

  const setCoinConfig = (config: CoinConfig<T>): void => {
    coinConfig = config;
  };

  const getCoinConfig = (): T => {
    if (!coinConfig) {
      throw new MissingCoinConfig();
    }

    return coinConfig();
  };

  return {
    setCoinConfig,
    getCoinConfig,
  };
}

export default buildCoinConfig;
