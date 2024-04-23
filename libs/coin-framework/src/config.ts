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
