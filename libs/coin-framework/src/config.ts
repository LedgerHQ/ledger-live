export type CommonCurrencyConfig = {
  status: {
    type: "active" | "under_maintenance";
  };
};

export type CurrencyConfig<Config = Record<string, unknown>> = CommonCurrencyConfig & Config;
