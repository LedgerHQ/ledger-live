export type ProtectStateNumber = 800 | 900 | 1000 | 1100 | 1200;

export type ServicesConfigParams = {
  managerStatesData: Record<ProtectStateNumber, Record<string, string>>;
};

export type ServicesConfig = {
  enabled?: boolean;
  params?: ServicesConfigParams;
};
