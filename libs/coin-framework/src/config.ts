export type CurrencyConfig = {
  status: {
    type: "active" | "under_maintenance" | "will_be_deprecated" | "deprecated";
    [key: string]: unknown;
  };
};
