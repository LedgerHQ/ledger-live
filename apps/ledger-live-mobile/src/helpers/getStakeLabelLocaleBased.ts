import { getDeviceRegion } from "@shared/device-locale";

export const getCountryLocale = (): string => getDeviceRegion() ?? "";

export const getEarnOrYieldSuffix = (): "yield" | "earn" =>
  getCountryLocale() === "GB" ? "yield" : "earn";

export const getStakeLabelLocaleBased = () => `account.${getEarnOrYieldSuffix()}` as const;
