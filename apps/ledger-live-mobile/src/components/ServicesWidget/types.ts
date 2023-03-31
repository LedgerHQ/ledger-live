export enum ProtectStateNumberEnum {
  NEW = "NEW",
}

export type ServicesConfigParams = {
  login: Record<string, string>;
  managerStatesData: Record<ProtectStateNumberEnum, Record<string, string>>;
};

export type ServicesConfig = {
  enabled?: boolean;
  params?: ServicesConfigParams;
};
