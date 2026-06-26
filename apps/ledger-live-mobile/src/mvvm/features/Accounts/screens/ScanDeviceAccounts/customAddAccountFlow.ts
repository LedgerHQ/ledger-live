import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import customAddAccountFlowByFamily from "~/generated/customAddAccountFlow";
import type { ScanDeviceAccountsNavigationProps } from "./types";

export type ImportAccountsParams = {
  navigation: ScanDeviceAccountsNavigationProps["navigation"];
  routeParams: ScanDeviceAccountsNavigationProps["route"]["params"];
  accountsToAdd: Account[];
};

export type DeviceConnectedParams = {
  navigation: {
    navigate: (name: string, params?: unknown) => void;
  };
  routeParams: Record<string, unknown>;
};

export type CustomAddAccountFlow = {
  onImportAccounts?: (params: ImportAccountsParams) => void;
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
