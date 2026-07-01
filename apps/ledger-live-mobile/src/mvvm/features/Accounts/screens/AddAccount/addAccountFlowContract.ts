import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Device } from "@ledgerhq/types-devices";
import type { AddAccountContextType } from "./types";

// Family handlers call navigate/replace with family-specific routes.
export type AddAccountFlowNavigation = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: (...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replace: (...args: any[]) => void;
};

export type AddAccountFlowRouteParams = {
  currency: CryptoOrTokenCurrency;
  context?: AddAccountContextType;
  onCloseNavigation?: () => void;
  navigationDepth?: number;
  inline?: boolean;
  returnToSwap?: boolean;
  onSuccess?: (res: { scannedAccounts: Account[]; selected: Account[] }) => void;
};

export type DeviceConnectedParams = {
  navigation: AddAccountFlowNavigation;
  currency: CryptoOrTokenCurrency;
  device: Device;
  connectResult: AppResult;
  routeParams: AddAccountFlowRouteParams;
};

export type ImportAccountsParams = {
  navigation: AddAccountFlowNavigation;
  currency: CryptoOrTokenCurrency;
  device: Device;
  accountsToAdd: Account[];
  routeParams: AddAccountFlowRouteParams;
};

export type AddAccountFlowHandlers = {
  onDeviceConnected?: (params: DeviceConnectedParams) => void;
  onImportAccounts?: (params: ImportAccountsParams) => void;
};
