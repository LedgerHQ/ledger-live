export type LldNanoSUpsellBannersConfig = {
  manager: boolean;
  accounts: boolean;
  notification_center: boolean;
  link: string;
  img?: string;
  "%"?: number;
};

export type LlmNanoSUpsellBannersConfig = {
  manager: boolean;
  accounts: boolean;
  notification_center: boolean;
  wallet?: boolean;
  link: string;
  "%"?: number;
};
