export enum ProtectStateNumberEnum {
  NEW = 1100,
  CONFIRM_IDENTITY = 1200,
  ADD_PAYMENT = 1201,
  PAYMENT_REJECTED = 1300,
  SUBSCRIPTION_CANCELED = 1400,
  ACTIVE = 1500,
}

export enum ProtectEnv {
  PREPROD = "preprod",
  STAGING = "staging",
  SIMU = "simu",
  PROD = "prod",
  SEC = "sec",
  SIT = "sit",
}

export type ProtectData = {
  services: {
    Protect: {
      available: boolean;
      active: boolean;
      payment_due: boolean;
      subscribed_at: number;
      last_payment_date: number;
    };
  };
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
};
