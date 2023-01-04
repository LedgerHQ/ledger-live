export enum ProtectStateNumberEnum {
  NEW = 1100,
  CONFIRM_IDENTITY = 1200,
  ADD_PAYMENT = 1201,
  PAYMENT_REJECTED = 1300,
  SUBSCRIPTION_CANCELED = 1400,
  ACTIVE = 1500,
}

export type ServicesConfigParams = {
  login: Record<string, string>;
  managerStatesData: Record<ProtectStateNumberEnum, Record<string, string>>;
};

export type ServicesConfig = {
  enabled?: boolean;
  params?: ServicesConfigParams;
};
