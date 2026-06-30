import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import customAddAccountFlowByFamily from "~/generated/customAddAccountFlow";
import type {
  DeviceSelectionNavigationProps,
  SelectDeviceRouteParams,
} from "../DeviceSelection/types";

export type DeviceConnectedParams = {
  navigation: DeviceSelectionNavigationProps["navigation"];
  routeParams: SelectDeviceRouteParams;
};

export type CustomAddAccountFlow = {
  onDeviceConnected?: (params: DeviceConnectedParams) => void;
};

const isCustomAddAccountFlowFamily = (
  family: string,
): family is keyof typeof customAddAccountFlowByFamily =>
  Object.prototype.hasOwnProperty.call(customAddAccountFlowByFamily, family);

export const getCustomAddAccountFlow = (
  currency: CryptoOrTokenCurrency,
): CustomAddAccountFlow | null => {
  if (currency.type !== "CryptoCurrency") return null;
  if (!isCustomAddAccountFlowFamily(currency.family)) return null;
  return customAddAccountFlowByFamily[currency.family];
};
