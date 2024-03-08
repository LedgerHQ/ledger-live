export type CommonCurrencyConfig = {
  status: {
    type: "active" | "under_maintenance";
  };
};

export type CurrencyConfig<Config extends Record<string, unknown>> = CommonCurrencyConfig & Config;
